import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const originalInvoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!originalInvoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Determine new dates (Next month end?)
        // Default logic: Next month relative to original billing date? Or Today?
        // Let's set to next month of original billing date as a smart default, or just reset to empty/null if schema allowed.
        // Schema requires billingDate/paymentDueDate.
        // Let's assume duplications are for recurring specific tasks.
        const newBillingDate = endOfMonth(addMonths(new Date(originalInvoice.billingDate), 1));
        const newPaymentDueDate = endOfMonth(addMonths(new Date(originalInvoice.paymentDueDate), 1));

        const newInvoice = await prisma.invoice.create({
            data: {
                freelancerId: originalInvoice.freelancerId,
                creatorId: session.user.id,
                status: "DRAFT",
                billingDate: newBillingDate,
                paymentDueDate: newPaymentDueDate,
                notes: originalInvoice.notes,
                subtotal: originalInvoice.subtotal,
                withholdingTaxSubtotal: originalInvoice.withholdingTaxSubtotal,
                totalWithTax: originalInvoice.totalWithTax,
                withholdingTax: originalInvoice.withholdingTax,
                invoiceAmount: originalInvoice.invoiceAmount,

                // Notes regarding snapshot: clear them
                companySnapshot: null,
                freelancerSnapshot: null,
                invoiceNumber: null,
                confirmedAt: null,
                paymentDate: null,

                items: {
                    create: originalInvoice.items.map(item => ({
                        productId: item.productId,
                        lineNumber: item.lineNumber,
                        productName: item.productName,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        commissionRate: item.commissionRate,
                        taxType: item.taxType,
                        taxRate: item.taxRate,
                        withholdingTaxTarget: item.withholdingTaxTarget,
                        amount: item.amount
                    }))
                }
            },
            include: { items: true }
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                invoiceId: newInvoice.id,
                action: "INVOICE_DUPLICATE",
                details: `Duplicated from invoice ID: ${originalInvoice.id}`
            }
        });

        return NextResponse.json({ invoice: newInvoice }, { status: 201 });

    } catch (error) {
        console.error("Failed to duplicate invoice:", error);
        return NextResponse.json(
            { error: "Failed to duplicate invoice" },
            { status: 500 }
        );
    }
}
