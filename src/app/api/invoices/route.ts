import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateInvoice } from "@/lib/calculations";

const invoiceItemSchema = z.object({
    productId: z.string().nullable().optional(), // Can be null for manual entry
    productName: z.string().min(1, "商品名は必須です"),
    unitPrice: z.number(),
    quantity: z.number().min(1),
    commissionRate: z.number().default(100.00),
    taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
    taxRate: z.number(),
    withholdingTaxTarget: z.boolean(),
});

const createInvoiceSchema = z.object({
    freelancerId: z.string().uuid(),
    billingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です(YYYY-MM-DD)"), // Recieve as format string
    paymentDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です(YYYY-MM-DD)"),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, "明細は1行以上必要です"),
});

export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const freelancerName = searchParams.get("freelancerName");
    const creatorName = searchParams.get("creatorName");
    const billingDateFrom = searchParams.get("billingDateFrom");
    const billingDateTo = searchParams.get("billingDateTo");

    try {
        const whereClause: any = {};
        if (status) whereClause.status = status;

        // If freelancer logged in, restrict to their invoices
        if (session.user.role === "FREELANCER") {
            const freelancer = await prisma.freelancer.findUnique({
                where: { userId: session.user.id }
            });
            if (!freelancer) {
                return NextResponse.json({ invoices: [] });
            }
            whereClause.freelancerId = freelancer.id;
        }

        // Search by freelancer name
        if (freelancerName) {
            whereClause.freelancer = {
                name: { contains: freelancerName }
            };
        }

        // Search by creator name
        if (creatorName) {
            whereClause.creator = {
                username: { contains: creatorName }
            };
        }

        // Date range filter
        if (billingDateFrom || billingDateTo) {
            whereClause.billingDate = {};
            if (billingDateFrom) {
                whereClause.billingDate.gte = new Date(billingDateFrom);
            }
            if (billingDateTo) {
                whereClause.billingDate.lte = new Date(billingDateTo);
            }
        }

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                freelancer: {
                    select: { name: true }
                },
                creator: {
                    select: { username: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        const formattedInvoices = invoices.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            freelancerName: inv.freelancer.name,
            billingDate: inv.billingDate.toISOString(),
            paymentDueDate: inv.paymentDueDate.toISOString(),
            invoiceAmount: Number(inv.invoiceAmount),
            status: inv.status,
            creatorName: inv.creator.username,
            createdAt: inv.createdAt.toISOString(),
        }));

        return NextResponse.json({ invoices: formattedInvoices });
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json(
            { error: "Failed to fetch invoices" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Usually only COMPANY creates invoices from SC-05
    // FREELANCER usually doesn't create invoices in this system flow (System creates for them or Company creates).
    // Assuming Company creates.
    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = createInvoiceSchema.parse(json);

        // 1. Calculate amounts
        const calculation = calculateInvoice(body.items);

        // 2. Fetch Company Info for Snapshot (At creation time? Or Confirmation time? 
        //    Design doc says "Invoice" has snapshot columns. Usually snapshot is taken at CONFIRMATION, 
        //    but saving it at Draft is also fine or leave null. 
        //    Let's leave snapshots null for DRAFT, they will be filled at Confirmation.)

        // 3. Create Invoice
        const invoice = await prisma.invoice.create({
            data: {
                freelancerId: body.freelancerId,
                creatorId: session.user.id,
                status: "DRAFT",
                billingDate: new Date(body.billingDate),
                paymentDueDate: new Date(body.paymentDueDate),
                notes: body.notes,

                // Amounts
                subtotal: calculation.subtotal,
                withholdingTaxSubtotal: calculation.withholdingTaxSubtotal,
                totalWithTax: calculation.totalWithTax,
                withholdingTax: calculation.withholdingTax,
                invoiceAmount: calculation.invoiceAmount,

                items: {
                    create: body.items.map((item, index) => ({
                        productId: item.productId || null,
                        lineNumber: index + 1,
                        productName: item.productName,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        commissionRate: item.commissionRate,
                        taxType: item.taxType,
                        taxRate: item.taxRate,
                        withholdingTaxTarget: item.withholdingTaxTarget,
                        amount: calculation.items[index].amount // Calculated amount
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                invoiceId: invoice.id,
                action: "INVOICE_CREATE",
                details: "Created draft invoice"
            }
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: (error as any).errors },
                { status: 400 }
            );
        }
        console.error("Failed to create invoice:", error);
        return NextResponse.json(
            { error: "Failed to create invoice" },
            { status: 500 }
        );
    }
}
