'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { calculateInvoice } from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/Input';

const invoiceItemSchema = z.object({
    productId: z.string().nullable().optional(),
    productName: z.string().min(1, '商品名は必須です').max(200),
    unitPrice: z.number().min(0, '単価は0以上である必要があります'),
    quantity: z.number().int().min(1, '個数は1以上である必要があります'),
    commissionRate: z.number().min(0).max(100),
    taxType: z.enum(['INCLUSIVE', 'EXCLUSIVE']),
    taxRate: z.number().min(0).max(100),
    withholdingTaxTarget: z.boolean(),
});

const invoiceSchema = z.object({
    freelancerId: z.string().min(1, 'フリーランスを選択してください'),
    billingDate: z.string().min(1, '請求締日は必須です'),
    paymentDueDate: z.string().min(1, '支払予定日は必須です'),
    notes: z.string().max(1000).optional(),
    items: z.array(invoiceItemSchema).min(1, '明細を1行以上入力してください'),
}).refine(
    (data) => new Date(data.paymentDueDate) >= new Date(data.billingDate),
    {
        message: '支払予定日は請求締日以降の日付を指定してください',
        path: ['paymentDueDate'],
    }
);

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceEditPage() {
    const router = useRouter();
    const { id } = useParams();
    const invoiceId = Array.isArray(id) ? id[0] : id;

    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [calculation, setCalculation] = useState<any>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const watchedItems = watch('items');

    useEffect(() => {
        Promise.all([fetchFreelancers(), fetchInvoice()]);
    }, []);

    useEffect(() => {
        if (watchedItems && watchedItems.length > 0) {
            const calc = calculateInvoice(watchedItems as any);
            setCalculation(calc);
        }
    }, [watchedItems]);

    const fetchFreelancers = async () => {
        try {
            const response = await fetch('/api/freelancers?status=ACTIVE');
            if (response.ok) {
                const data = await response.json();
                setFreelancers(data.freelancers || []);
            }
        } catch (error) {
            console.error('Failed to fetch freelancers:', error);
        }
    };

    const fetchInvoice = async () => {
        if (!invoiceId) return;
        try {
            const response = await fetch(`/api/invoices/${invoiceId}`);
            if (response.ok) {
                const invoice = await response.json();
                if (invoice.status !== 'DRAFT' && invoice.status !== 'REJECTED') {
                    alert('編集できないステータスです');
                    router.push(`/invoices/${invoiceId}`);
                    return;
                }

                // Reset form with fetched data
                reset({
                    freelancerId: invoice.freelancerId,
                    billingDate: new Date(invoice.billingDate).toISOString().split('T')[0],
                    paymentDueDate: new Date(invoice.paymentDueDate).toISOString().split('T')[0],
                    notes: invoice.notes || '',
                    items: invoice.items.map((item: any) => ({
                        productId: item.productId,
                        productName: item.productName,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        commissionRate: item.commissionRate,
                        taxType: item.taxType,
                        taxRate: item.taxRate,
                        withholdingTaxTarget: item.withholdingTaxTarget,
                    })),
                });
            }
        } catch (error) {
            console.error('Failed to fetch invoice:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: InvoiceFormData, status?: string) => {
        setIsSaving(true);
        try {
            const payload = { ...data, status };
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert('保存しました');
                router.push(status ? '/invoices' : `/invoices/${invoiceId}`);
            } else {
                const error = await response.json();
                alert(error.error?.message || '保存に失敗しました');
            }
        } catch (error) {
            alert('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">請求書編集</h1>
            </div>

            <form>
                {/* Same Form Sections as New Page - Ideally verify component reusability later */}
                <Card className="mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-blue-600">基本情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">フリーランス</label>
                                <select
                                    {...register('freelancerId')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    disabled // Can't change freelancer on edit usually, or allow? Let's allow.
                                >
                                    <option value="">選択してください</option>
                                    {freelancers.map((fl) => (
                                        <option key={fl.id} value={fl.id}>{fl.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">請求締日</label>
                                <input type="date" {...register('billingDate')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">支払予定日</label>
                                <input type="date" {...register('paymentDueDate')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                {errors.paymentDueDate && <p className="text-xs text-red-600 mt-1">{errors.paymentDueDate.message}</p>}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Line Items Table (Simplified copy from New Page) */}
                <Card className="mb-6">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">明細</h2>
                            <Button type="button" variant="secondary" size="sm" onClick={() => append({ productName: '', unitPrice: 0, quantity: 1, commissionRate: 100, taxType: 'EXCLUSIVE', taxRate: 10, withholdingTaxTarget: true })}>
                                ➕ 追加
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 border">商品名</th>
                                        <th className="px-2 py-2 border">単価</th>
                                        <th className="px-2 py-2 border">個数</th>
                                        <th className="px-2 py-2 border">金額(税別)</th>
                                        <th className="px-2 py-2 border"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field, index) => (
                                        <tr key={field.id}>
                                            <td className="px-2 py-2 border"><input {...register(`items.${index}.productName`)} className="w-full px-2 py-1 border rounded" /></td>
                                            <td className="px-2 py-2 border"><input type="number" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} className="w-20 px-2 py-1 border rounded text-right" /></td>
                                            <td className="px-2 py-2 border"><input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-16 px-2 py-1 border rounded text-right" /></td>
                                            <td className="px-2 py-2 border text-right">
                                                {/* Simple calc display for edit mode brevity, full logic is in state */}
                                                ¥{formatCurrency(calculation?.items[index]?.amount || 0)}
                                            </td>
                                            <td className="px-2 py-2 border text-center">
                                                <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>削除</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                <Card className="mb-6">
                    <div className="p-6">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between"><span className="text-gray-600">請求額 (税込)</span><span className="font-bold text-blue-600">¥{formatCurrency(calculation?.invoiceAmount || 0)}</span></div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="mb-6">
                    <div className="p-6">
                        <label className="block text-sm font-medium mb-2">備考</label>
                        <textarea {...register('notes')} className="w-full border rounded p-2" rows={3}></textarea>
                    </div>
                </Card>

                <div className="flex gap-4 justify-end">
                    <Button type="button" variant="secondary" onClick={() => router.push(`/invoices/${invoiceId}`)}>キャンセル</Button>
                    <Button type="button" variant="secondary" disabled={isSaving} onClick={handleSubmit((data) => onSubmit(data))}>保存</Button>
                    <Button type="button" variant="primary" disabled={isSaving} onClick={handleSubmit((data) => onSubmit(data, 'PENDING_APPROVAL'))}>確定</Button>
                </div>
            </form>
        </div>
    );
}
