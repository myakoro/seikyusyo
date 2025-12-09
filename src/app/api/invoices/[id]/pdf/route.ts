import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import React from "react";

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
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Authorization check
        if (session.user.role === "FREELANCER") {
            const freelancer = await prisma.freelancer.findUnique({
                where: { userId: session.user.id }
            });
            if (!freelancer || invoice.freelancerId !== freelancer.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else if (session.user.role !== "COMPANY" && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Render PDF
        const stream = await renderToStream(<InvoicePDF invoice={ invoice } />);

        // Return stream response
        // Next.js Response supports standard Web Streams
        return new NextResponse(stream as unknown as ReadableStream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice_${invoice.invoiceNumber || invoice.id}.pdf"`
            }
        });

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
