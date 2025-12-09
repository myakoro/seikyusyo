'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateInvoice } from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';

const invoiceItemSchema = z.object({
    productId: z.string().nullable(),
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

export default function InvoiceNewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const freelancerId = searchParams?.get('freelancerId');

    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [calculation, setCalculation] = useState<any>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            freelancerId: freelancerId || '',
            billingDate: getLastDayOfPreviousMonth(),
            paymentDueDate: getLastDayOfNextMonth(),
            items: [
                {
                    productId: null,
                    productName: '',
                    unitPrice: 0,
                    quantity: 1,
                    commissionRate: 100,
                    taxType: 'EXCLUSIVE' as const,
                    taxRate: 10,
                    withholdingTaxTarget: true,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const watchedItems = watch('items');

    useEffect(() => {
        fetchFreelancers();
    }, []);

    useEffect(() => {
        // Recalculate when items change
        if (watchedItems && watchedItems.length > 0) {
            const calc = calculateInvoice(watchedItems);
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

    const onSubmit = async (data: InvoiceFormData, isDraft: boolean) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, isDraft }),
            });

            if (response.ok) {
                const invoice = await response.json();
                alert(isDraft ? '下書きを保存しました' : '請求書を確定しました');
                router.push('/invoices');
            } else {
                const error = await response.json();
                alert(error.error?.message || '保存に失敗しました');
            }
        } catch (error) {
            alert('保存に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">請求書作成</h1>
                <p className="text-gray-600 mt-2">新規請求書を作成します</p>
            </div>

            <form>
                {/* Basic Information */}
                <Card className="mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-blue-600">
                            基本情報
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    フリーランス選択 <span className="text-red-600">*</span>
                                </label>
                                <select
                                    {...register('freelancerId')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="">選択してください</option>
                                    {freelancers.map((fl) => (
                                        <option key={fl.id} value={fl.id}>
                                            {fl.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.freelancerId && (
                                    <p className="text-xs text-red-600 mt-1">{errors.freelancerId.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    請求締日 <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('billingDate')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                {errors.billingDate && (
                                    <p className="text-xs text-red-600 mt-1">{errors.billingDate.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    支払予定日 <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('paymentDueDate')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                {errors.paymentDueDate && (
                                    <p className="text-xs text-red-600 mt-1">{errors.paymentDueDate.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Line Items */}
                <Card className="mb-6">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-blue-600">
                            <h2 className="text-lg font-semibold">明細</h2>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    append({
                                        productId: null,
                                        productName: '',
                                        unitPrice: 0,
                                        quantity: 1,
                                        commissionRate: 100,
                                        taxType: 'EXCLUSIVE',
                                        taxRate: 10,
                                        withholdingTaxTarget: true,
                                    })
                                }
                            >
                                ➕ 明細行を追加
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-2 py-2 text-center border">商品名</th>
                                        <th className="px-2 py-2 text-center border">単価</th>
                                        <th className="px-2 py-2 text-center border">個数</th>
                                        <th className="px-2 py-2 text-center border">報酬率(%)</th>
                                        <th className="px-2 py-2 text-center border">消費税</th>
                                        <th className="px-2 py-2 text-center border">税率(%)</th>
                                        <th className="px-2 py-2 text-center border">源泉税</th>
                                        <th className="px-2 py-2 text-center border">金額(税別)</th>
                                        <th className="px-2 py-2 text-center border"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field, index) => (
                                        <tr key={field.id}>
                                            <td className="px-2 py-2 border">
                                                <input
                                                    {...register(`items.${index}.productName`)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholder="商品名"
                                                />
                                            </td>
                                            <td className="px-2 py-2 border">
                                                <input
                                                    type="number"
                                                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                                />
                                            </td>
                                            <td className="px-2 py-2 border">
                                                <input
                                                    type="number"
                                                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                                />
                                            </td>
                                            <td className="px-2 py-2 border">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    {...register(`items.${index}.commissionRate`, { valueAsNumber: true })}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                                />
                                            </td>
                                            <td className="px-2 py-2 border">
                                                <select
                                                    {...register(`items.${index}.taxType`)}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    <option value="EXCLUSIVE">別</option>
                                                    <option value="INCLUSIVE">込</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 border">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                                />
                                            </td>
                                            <td className="px-2 py-2 border text-center">
                                                <input
                                                    type="checkbox"
                                                    {...register(`items.${index}.withholdingTaxTarget`)}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-2 py-2 border text-right font-medium">
                                                {calculation?.items[index]
                                                    ? `¥${formatCurrency(calculation.items[index].amount)}`
                                                    : '¥0'}
                                            </td>
                                            <td className="px-2 py-2 border text-center">
                                                {fields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                    >
                                                        削除
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                {/* Summary */}
                <Card className="mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-blue-600">
                            集計
                        </h2>

                        <div className="flex justify-end">
                            <table className="w-96">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-2 text-right text-gray-600">小計（税別）</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{formatCurrency(calculation?.subtotal || 0)}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-right text-gray-600">内、源泉税対象小計（税別）</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{formatCurrency(calculation?.withholdingTaxSubtotal || 0)}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-right text-gray-600">合計（税込）</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{formatCurrency(calculation?.totalWithTax || 0)}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-right text-gray-600">源泉所得税</td>
                                        <td className="py-2 text-right font-medium text-red-600">
                                            -¥{formatCurrency(calculation?.withholdingTax || 0)}
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-100">
                                        <td className="py-3 text-right font-bold text-lg">請求額（税込）</td>
                                        <td className="py-3 text-right font-bold text-lg text-blue-600">
                                            ¥{formatCurrency(calculation?.invoiceAmount || 0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                {/* Notes */}
                <Card className="mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-blue-600">
                            備考
                        </h2>
                        <textarea
                            {...register('notes')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            rows={4}
                            placeholder="備考（1000文字以内）"
                        />
                        {errors.notes && (
                            <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>
                        )}
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex gap-4 justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/invoices')}
                        disabled={isLoading}
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSubmit((data) => onSubmit(data, true))}
                        disabled={isLoading}
                    >
                        下書き保存
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit((data) => onSubmit(data, false))}
                        disabled={isLoading}
                        isLoading={isLoading}
                    >
                        確定
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Helper functions
function getLastDayOfPreviousMonth(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return lastMonth.toISOString().split('T')[0];
}

function getLastDayOfNextMonth(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return nextMonth.toISOString().split('T')[0];
}
