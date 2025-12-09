'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface InvoiceDetail extends Invoice {
    items: InvoiceItem[];
    freelancer: Freelancer;
    creator: { username: string };
}

interface Invoice {
    id: string;
    invoiceNumber: string | null;
    billingDate: string;
    paymentDueDate: string;
    invoiceAmount: number;
    subtotal: number;
    withholdingTaxSubtotal: number;
    totalWithTax: number;
    withholdingTax: number;
    status: string;
    notes: string | null;
    createdAt: string;
}

interface InvoiceItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxType: string;
    taxRate: number;
}

interface Freelancer {
    name: string;
}

export default function InvoiceDetailPage() {
    const { id } = useParams(); // useParams returns params object, id might be string or string[]
    const router = useRouter();
    const invoiceId = Array.isArray(id) ? id[0] : id; // Ensure string

    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (invoiceId) {
            fetchInvoice(invoiceId);
        }
    }, [invoiceId]);

    const fetchInvoice = async (id: string) => {
        try {
            const response = await fetch(`/api/invoices/${id}`);
            if (response.ok) {
                const data = await response.json();
                setInvoice(data);
            } else {
                // Handle error (e.g., redirect to 404)
                console.error("Failed to fetch invoice");
            }
        } catch (error) {
            console.error("Error fetching invoice:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!invoice || !confirm('この請求書を削除してもよろしいですか？')) return;

        try {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('削除しました');
                router.push('/invoices');
            } else {
                alert('削除に失敗しました');
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
        return <div className="p-8 text-center">読み込み中...</div>;
    }

    if (!invoice) {
        return <div className="p-8 text-center">請求書が見つかりません</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        請求書詳細: {invoice.invoiceNumber || '未採番'}
                    </h1>
                    <div className="flex gap-2">
                        {getStatusBadge(invoice.status)}
                        <span className="text-sm text-gray-500 self-center">
                            作成日: {formatDate(invoice.createdAt)}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/invoices">
                        <Button variant="secondary">一覧へ戻る</Button>
                    </Link>
                    {(invoice.status === 'DRAFT' || invoice.status === 'REJECTED') && (
                        <Link href={`/invoices/${invoice.id}/edit`}>
                            <Button variant="primary">編集</Button>
                        </Link>
                    )}
                    {invoice.status === 'DRAFT' && (
                        <Button variant="danger" onClick={handleDelete}>削除</Button>
                    )}
                    <Button variant="ghost">🖨️ PDF出力</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>基本情報</CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0 space-y-3">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">フリーランス</span>
                            <span className="font-medium">{invoice.freelancer.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">請求締日</span>
                            <span className="font-medium">{formatDate(invoice.billingDate)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">支払予定日</span>
                            <span className="font-medium">{formatDate(invoice.paymentDueDate)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">作成者</span>
                            <span className="font-medium">{invoice.creator.username}</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>金額情報</CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0 space-y-3">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">小計 (税抜)</span>
                            <span className="font-medium">¥{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">消費税等</span>
                            <span className="font-medium">¥{formatCurrency(invoice.totalWithTax - invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">源泉徴収税額</span>
                            <span className="font-medium text-red-600">-¥{formatCurrency(invoice.withholdingTax)}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-lg font-bold text-gray-900">請求金額 (税込)</span>
                            <span className="text-lg font-bold text-blue-600">¥{formatCurrency(invoice.invoiceAmount)}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>明細</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">内容</th>
                                <th className="px-6 py-3 text-right">単価</th>
                                <th className="px-6 py-3 text-right">数量</th>
                                <th className="px-6 py-3 text-right">金額 (税抜)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.productName}</td>
                                    <td className="px-6 py-4 text-right">¥{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right">¥{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {invoice.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>備考</CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0 whitespace-pre-wrap text-gray-700">
                        {invoice.notes}
                    </div>
                </Card>
            )}
        </div>
    );
}
