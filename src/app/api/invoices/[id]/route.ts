import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateInvoice } from "@/lib/calculations";

// Schema same as create but just for validation reuse
const invoiceItemSchema = z.object({
    productId: z.string().nullable().optional(),
    productName: z.string().min(1, "商品名は必須です"),
    unitPrice: z.number(),
    quantity: z.number().min(1),
    commissionRate: z.number().default(100.00),
    taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
    taxRate: z.number(),
    withholdingTaxTarget: z.boolean(),
});

const updateInvoiceSchema = z.object({
    billingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です(YYYY-MM-DD)").optional(),
    paymentDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です(YYYY-MM-DD)").optional(),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, "明細は1行以上必要です").optional(),
});

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: {
                items: {
                    orderBy: { lineNumber: 'asc' }
                },
                freelancer: true,
                creator: {
                    select: { username: true }
                },
                statusHistory: {
                    include: {
                        changer: { select: { username: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Access check for freelancer
        if (session.user.role === "FREELANCER") {
            const freelancer = await prisma.freelancer.findUnique({
                where: { userId: session.user.id }
            });
            if (!freelancer || invoice.freelancerId !== freelancer.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Failed to fetch invoice:", error);
        return NextResponse.json(
            { error: "Failed to fetch invoice" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = updateInvoiceSchema.parse(json);

        // Check status
        const currentInvoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: { items: true }
        });
        if (!currentInvoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }
        if (currentInvoice.status !== "DRAFT" && currentInvoice.status !== "REJECTED") {
            // Allow editing REJECTED? Usually yes, to fix and resubmit.
            // But for minimal scope let's say DRAFT/REJECTED is editable, processed ones not.
            const editableStatuses = ["DRAFT", "REJECTED"];
            if (!editableStatuses.includes(currentInvoice.status)) {
                return NextResponse.json({ error: "Cannot edit invoice in current status" }, { status: 400 });
            }
        }

        // If items provided, re-calculate
        let updateData: any = {
            notes: body.notes,
        };
        if (body.billingDate) updateData.billingDate = new Date(body.billingDate);
        if (body.paymentDueDate) updateData.paymentDueDate = new Date(body.paymentDueDate);

        await prisma.$transaction(async (tx) => {
            if (body.items) {
                const calculation = calculateInvoice(body.items);

                // Update Amount fields
                updateData.subtotal = calculation.subtotal;
                updateData.withholdingTaxSubtotal = calculation.withholdingTaxSubtotal;
                updateData.totalWithTax = calculation.totalWithTax;
                updateData.withholdingTax = calculation.withholdingTax;
                updateData.invoiceAmount = calculation.invoiceAmount;

                // Replace Items
                await tx.invoiceItem.deleteMany({
                    where: { invoiceId: params.id }
                });

                await tx.invoiceItem.createMany({
                    data: body.items.map((item: any, index: number) => ({
                        invoiceId: params.id,
                        productId: item.productId || null,
                        lineNumber: index + 1,
                        productName: item.productName,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        commissionRate: item.commissionRate,
                        taxType: item.taxType,
                        taxRate: item.taxRate,
                        withholdingTaxTarget: item.withholdingTaxTarget,
                        amount: calculation.items[index].amount
                    }))
                });
            }

            // Update Invoice Header
            await tx.invoice.update({
                where: { id: params.id },
                data: updateData
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    invoiceId: params.id,
                    action: "INVOICE_UPDATE",
                    details: "Updated invoice details"
                }
            });
        });

        const updatedInvoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: { items: true }
        });

        return NextResponse.json(updatedInvoice);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Failed to update invoice:", error);
        return NextResponse.json(
            { error: "Failed to update invoice" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: params.id }
        });
        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status !== "DRAFT") {
            return NextResponse.json({ error: "Only DRAFT invoices can be deleted" }, { status: 400 });
        }

        // Cascade delete handles items, but we should do it explicitly transactionally if complex logic needed.
        // Schema says ON DELETE CASCADE for Items and History.
        await prisma.invoice.delete({
            where: { id: params.id }
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                invoiceId: params.id, // ID is gone, but we can store it as string ref? AuditLog invoice_id relies on FK ON DELETE SET NULL.
                // So invoice_id becomes null.
                // To keep reference, we should put ID in details.
                action: "INVOICE_DELETE",
                details: `Deleted invoice ID: ${params.id}`
            }
        });

        return NextResponse.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        console.error("Failed to delete invoice:", error);
        return NextResponse.json(
            { error: "Failed to delete invoice" },
            { status: 500 }
        );
    }
}
