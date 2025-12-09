'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
    id: string;
    invoiceNumber: string | null;
    freelancerName: string;
    billingDate: string;
    paymentDueDate: string;
    invoiceAmount: number;
    status: string;
    creatorName: string;
    createdAt: string;
}

export default function InvoiceListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        freelancerName: '',
        creatorName: '',
        billingDateFrom: '',
        billingDateTo: '',
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/api/invoices?${params}`);
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchInvoices();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('この請求書を削除してもよろしいですか？')) return;

        try {
            const response = await fetch(`/api/invoices/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('削除しました');
                fetchInvoices();
            } else {
                const error = await response.json();
                alert(error.error?.message || '削除に失敗しました');
            }
        } catch (error) {
            alert('削除に失敗しました');
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
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">請求書一覧</h1>
                    <p className="text-gray-600 mt-2">請求書の検索・一覧表示</p>
                </div>
                <Link href="/invoices/new">
                    <Button variant="primary" size="lg">
                        ➕ 新規作成
                    </Button>
                </Link>
            </div>

            {/* Search Form */}
            <Card className="mb-6">
                <form onSubmit={handleSearch} className="p-6 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ステータス
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">すべて</option>
                                <option value="DRAFT">下書き</option>
                                <option value="PENDING_APPROVAL">承認待ち</option>
                                <option value="REJECTED">差し戻し</option>
                                <option value="APPROVED">承認済</option>
                                <option value="PAID">支払済</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                フリーランス名
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="フリーランス名で検索"
                                value={filters.freelancerName}
                                onChange={(e) => setFilters({ ...filters, freelancerName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                作成者
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="作成者名で検索"
                                value={filters.creatorName}
                                onChange={(e) => setFilters({ ...filters, creatorName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                請求締日（開始）
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                value={filters.billingDateFrom}
                                onChange={(e) => setFilters({ ...filters, billingDateFrom: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                請求締日（終了）
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                value={filters.billingDateTo}
                                onChange={(e) => setFilters({ ...filters, billingDateTo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" variant="primary">
                            🔍 検索
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setFilters({
                                    status: '',
                                    freelancerName: '',
                                    creatorName: '',
                                    billingDateFrom: '',
                                    billingDateTo: '',
                                });
                                fetchInvoices();
                            }}
                        >
                            クリア
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Invoice Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    請求書番号
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    フリーランス名
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    請求締日
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    支払予定日
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    請求額
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    ステータス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    作成者
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    アクション
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        請求書がありません
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
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
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {formatDate(invoice.paymentDueDate)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                            ¥{formatCurrency(invoice.invoiceAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {invoice.creatorName}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Link href={`/invoices/${invoice.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        詳細
                                                    </Button>
                                                </Link>
                                                {(invoice.status === 'DRAFT' || invoice.status === 'REJECTED') && (
                                                    <>
                                                        <Link href={`/invoices/${invoice.id}/edit`}>
                                                            <Button variant="secondary" size="sm">
                                                                編集
                                                            </Button>
                                                        </Link>
                                                        {invoice.status === 'DRAFT' && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleDelete(invoice.id)}
                                                            >
                                                                削除
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
