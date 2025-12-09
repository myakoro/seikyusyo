import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const statusUpdateSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED", "PAID"]),
    comment: z.string().optional(),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です(YYYY-MM-DD)").optional(),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const json = await request.json();
        const body = statusUpdateSchema.parse(json);
        const invoiceId = id;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { freelancer: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Role check and State Transition Logic
        if (session.user.role === "FREELANCER") {
            // Freelancer can only APPROVE or REJECT when status is PENDING_APPROVAL
            if (invoice.status !== "PENDING_APPROVAL") {
                return NextResponse.json({ error: "Cannot change status" }, { status: 400 });
            }
            if (body.status !== "APPROVED" && body.status !== "REJECTED") {
                return NextResponse.json({ error: "Freelancer can only APPROVE or REJECT" }, { status: 400 });
            }

            // Ensure this freelancer owns the invoice
            const freelancer = await prisma.freelancer.findUnique({
                where: { userId: session.user.id }
            });
            if (!freelancer || freelancer.id !== invoice.freelancerId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

        } else if (session.user.role === "COMPANY") {
            // Company can mark as PAID when APPROVED
            // Or REJECT when PENDING_APPROVAL (send back)

            if (body.status === "PAID") {
                if (invoice.status !== "APPROVED") {
                    return NextResponse.json({ error: "Only APPROVED invoices can be paid" }, { status: 400 });
                }
            } else if (body.status === "REJECTED") {
                if (invoice.status !== "PENDING_APPROVAL") {
                    return NextResponse.json({ error: "Can only reject pending invoices" }, { status: 400 });
                }
            } else {
                return NextResponse.json({ error: "Invalid status transition for Company" }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Perform Update
        const result = await prisma.$transaction(async (tx) => {
            const updateData: any = {
                status: body.status,
            };

            if (body.status === "PAID" && body.paymentDate) {
                updateData.paymentDate = new Date(body.paymentDate);
            } else if (body.status === "PAID") {
                updateData.paymentDate = new Date(); // Default to now if not provided
            }

            const updated = await tx.invoice.update({
                where: { id: invoiceId },
                data: updateData
            });

            // History
            await tx.invoiceStatusHistory.create({
                data: {
                    invoiceId: invoiceId,
                    fromStatus: invoice.status,
                    toStatus: body.status,
                    changedBy: session.user.id,
                    comment: body.comment
                }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    invoiceId: invoiceId,
                    action: `INVOICE_${body.status}`,
                    details: body.comment
                }
            });

            return updated;
        });

        return NextResponse.json(result);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: (error as any).errors },
                { status: 400 }
            );
        }
        console.error("Failed to update invoice status:", error);
        return NextResponse.json(
            { error: "Failed to update invoice status" },
            { status: 500 }
        );
    }
}
