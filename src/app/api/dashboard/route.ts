import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current month date range
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get invoice count for current month
        const invoiceCount = await prisma.invoice.count({
            where: {
                billingDate: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                },
            },
        });

        // Get total amount for approved and paid invoices this month
        const invoices = await prisma.invoice.findMany({
            where: {
                billingDate: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                },
                status: {
                    in: ['APPROVED', 'PAID'],
                },
            },
            select: {
                invoiceAmount: true,
            },
        });

        const totalAmount = invoices.reduce(
            (sum, inv) => sum + Number(inv.invoiceAmount),
            0
        );

        // Get pending payment count (approved but not paid)
        const pendingPaymentCount = await prisma.invoice.count({
            where: {
                status: 'APPROVED',
            },
        });

        // Get recent 5 invoices
        const recentInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                freelancer: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const formattedInvoices = recentInvoices.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            freelancerName: inv.freelancer.name,
            invoiceAmount: Number(inv.invoiceAmount),
            status: inv.status,
            billingDate: inv.billingDate.toISOString(),
        }));

        return NextResponse.json({
            stats: {
                invoiceCount,
                totalAmount,
                pendingPaymentCount,
            },
            recentInvoices: formattedInvoices,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
