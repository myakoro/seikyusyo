import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Confirming invoice usually done by Creator (Company)
    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const invoiceId = params.id;

        // Use interactive transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch current invoice with relations required for snapshot
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { freelancer: true }
            });

            if (!invoice) throw new Error("INVOICE_NOT_FOUND");
            if (invoice.status !== "DRAFT" && invoice.status !== "REJECTED") {
                throw new Error("INVALID_STATUS_TRANSITION");
            }

            // 2. Fetch Company Info
            const companyInfo = await tx.companyInfo.findFirst();
            if (!companyInfo) throw new Error("COMPANY_INFO_MISSING");

            // 3. Generate Invoice Number
            // Format: YYYYMM-XXXX
            const billingDate = new Date(invoice.billingDate);
            const yearMonth = format(billingDate, "yyyyMM");

            // Find max invoice number for this month
            // We look for invoiceNumber starting with YYYYMM-
            // Note: Prisma startsWith filtering.
            const lastInvoice = await tx.invoice.findFirst({
                where: {
                    invoiceNumber: {
                        startsWith: `${yearMonth}-`
                    }
                },
                orderBy: {
                    invoiceNumber: 'desc'
                }
            });

            let nextSeq = 1;
            if (lastInvoice && lastInvoice.invoiceNumber) {
                const parts = lastInvoice.invoiceNumber.split("-");
                if (parts.length === 2) {
                    const currentSeq = parseInt(parts[1], 10);
                    if (!isNaN(currentSeq)) {
                        nextSeq = currentSeq + 1;
                    }
                }
            }
            const newInvoiceNumber = `${yearMonth}-${nextSeq.toString().padStart(4, '0')}`;

            // 4. Create Snapshots
            // Freelancer snapshot
            const freelancerSnapshot = {
                name: invoice.freelancer.name,
                postalCode: invoice.freelancer.postalCode,
                address: invoice.freelancer.address,
                phone: invoice.freelancer.phone,
                invoiceNumber: invoice.freelancer.invoiceNumber, // Qualified Invoice Number
                bankName: invoice.freelancer.bankName,
                bankBranch: invoice.freelancer.bankBranch,
                accountType: invoice.freelancer.accountType,
                accountNumber: invoice.freelancer.accountNumber,
                accountHolder: invoice.freelancer.accountHolder,
            };

            // Company snapshot
            const companySnapshot = {
                companyName: companyInfo.companyName,
                postalCode: companyInfo.postalCode,
                address: companyInfo.address,
                phone: companyInfo.phone,
                email: companyInfo.email,
            };

            // 5. Update Invoice
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: "PENDING_APPROVAL",
                    invoiceNumber: newInvoiceNumber,
                    freelancerSnapshot: JSON.stringify(freelancerSnapshot),
                    companySnapshot: JSON.stringify(companySnapshot),
                    confirmedAt: new Date(),
                }
            });

            // 6. Log History
            await tx.invoiceStatusHistory.create({
                data: {
                    invoiceId: invoiceId,
                    fromStatus: invoice.status,
                    toStatus: "PENDING_APPROVAL",
                    changedBy: session.user.id,
                    comment: "Invoice confirmed and sent for approval"
                }
            });

            // 7. Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    invoiceId: invoiceId,
                    action: "INVOICE_CONFIRM",
                    details: `Confirmed invoice: ${newInvoiceNumber}`
                }
            });

            return updatedInvoice;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Failed to confirm invoice:", error);

        if (error.message === "INVOICE_NOT_FOUND") {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }
        if (error.message === "INVALID_STATUS_TRANSITION") {
            return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
        }
        if (error.message === "COMPANY_INFO_MISSING") {
            return NextResponse.json({ error: "Company info not set" }, { status: 400 });
        }

        // Handle Unique constraint violation for invoiceNumber (retry client side?)
        // Error code P2002 is Unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Invoice number conflict, please try again" }, { status: 409 });
        }

        return NextResponse.json(
            { error: "Failed to confirm invoice" },
            { status: 500 }
        );
    }
}
