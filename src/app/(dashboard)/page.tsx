'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardStats {
    invoiceCount: number;
    totalAmount: number;
    pendingPaymentCount: number;
}

interface RecentInvoice {
    id: string;
    invoiceNumber: string | null;
    freelancerName: string;
    invoiceAmount: number;
    status: string;
    billingDate: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        invoiceCount: 0,
        totalAmount: 0,
        pendingPaymentCount: 0,
    });
    const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/dashboard');
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats || { invoiceCount: 0, totalAmount: 0, pendingPaymentCount: 0 });
                setRecentInvoices(data.recentInvoices || []);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: any; label: string }> = {
            DRAFT: { variant: 'draft', label: '下書き' },
            PENDING_APPROVAL: { variant: 'pending', label: '承認待ち' },
            REJECTED: { variant: 'rejected', label: '差し戻し' },
            APPROVED: { variant: 'approved', label: '承認済' },
            PAID: { variant: 'paid', label: '支払済' },
        };
        const config = statusMap[status] || { variant: 'draft', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">読み込み中...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
                <p className="text-gray-600 mt-2">請求書管理システムの概要</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-2">今月の請求書件数</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.invoiceCount}</p>
                        <p className="text-xs text-gray-400 mt-1">件</p>
                    </div>
                </Card>

                <Card>
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-2">今月の請求額合計</p>
                        <p className="text-3xl font-bold text-gray-900">
                            ¥{formatCurrency(stats.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">承認済・支払済の合計</p>
                    </div>
                </Card>

                <Card>
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-2">支払予定件数</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.pendingPaymentCount}</p>
                        <p className="text-xs text-gray-400 mt-1">件</p>
                    </div>
                </Card>
            </div>

            {/* Recent Invoices */}
            <Card>
                <CardHeader>
                    <CardTitle>最近の請求書</CardTitle>
                    <Link href="/invoices">
                        <Button variant="ghost" size="sm">すべて見る →</Button>
                    </Link>
                </CardHeader>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    請求書番号
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    フリーランス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    請求締日
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    請求額
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    ステータス
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        請求書がありません
                                    </td>
                                </tr>
                            ) : (
                                recentInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {invoice.invoiceNumber || '未採番'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {invoice.freelancerName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {formatDate(invoice.billingDate)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                            ¥{formatCurrency(invoice.invoiceAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Quick Actions */}
            <div className="mt-8 flex gap-4">
                <Link href="/invoices/new">
                    <Button variant="primary" size="lg">
                        ➕ 新規請求書作成
                    </Button>
                </Link>
                <Link href="/freelancers/new">
                    <Button variant="secondary" size="lg">
                        👤 フリーランス登録
                    </Button>
                </Link>
            </div>
        </div>
    );
}
