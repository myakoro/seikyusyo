'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const productSchema = z.object({
    name: z.string().min(1, "商品名は必須です"),
    description: z.string().optional(),
    unitPrice: z.number().min(0, "単価は0以上"),
    taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
    taxRate: z.number().min(0).max(100),
    withholdingTaxTarget: z.boolean(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    freelancerId: z.string().nullable().optional(), // Can use "" as null for select
});

type FormData = z.infer<typeof productSchema>;

export default function ProductCreatePage() {
    const router = useRouter();
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            unitPrice: 0,
            taxType: 'EXCLUSIVE',
            taxRate: 10,
            withholdingTaxTarget: true,
            status: 'ACTIVE',
            freelancerId: null, // Default to common
        },
    });

    useEffect(() => {
        // Fetch freelancers for association
        const fetchFreelancers = async () => {
            try {
                const res = await fetch('/api/freelancers?status=ACTIVE');
                if (res.ok) {
                    const data = await res.json();
                    setFreelancers(data.freelancers || []);
                }
            } catch (e) { console.error(e); }
        };
        fetchFreelancers();
    }, []);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        // Convert empty string to null for freelancerId
        const payload = {
            ...data,
            freelancerId: data.freelancerId === "" ? null : data.freelancerId
        };

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert('商品を登録しました');
                router.push('/products');
            } else {
                alert('登録に失敗しました');
            }
        } catch (error) {
            alert('エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">商品新規登録</h1>

            <Card className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium mb-1">商品名 <span className="text-red-500">*</span></label>
                        <Input {...register('name')} placeholder="例: Webサイト制作" />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">説明</label>
                        <textarea {...register('description')} className="w-full border rounded p-2" rows={3}></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">単価 (円) <span className="text-red-500">*</span></label>
                            <Input type="number" {...register('unitPrice', { valueAsNumber: true })} />
                            {errors.unitPrice && <p className="text-red-500 text-sm">{errors.unitPrice.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">消費税区分</label>
                            <select {...register('taxType')} className="w-full border rounded p-2">
                                <option value="EXCLUSIVE">税別</option>
                                <option value="INCLUSIVE">税込</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">消費税率 (%)</label>
                            <Input type="number" step="0.1" {...register('taxRate', { valueAsNumber: true })} />
                        </div>
                        <div className="flex items-center mt-6">
                            <input type="checkbox" {...register('withholdingTaxTarget')} id="withholding" className="w-4 h-4 mr-2" />
                            <label htmlFor="withholding" className="text-sm font-medium">源泉徴収対象</label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">関連フリーランス (任意)</label>
                        <select {...register('freelancerId')} className="w-full border rounded p-2">
                            <option value="">共通商品 (指定なし)</option>
                            {freelancers.map(fl => (
                                <option key={fl.id} value={fl.id}>{fl.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">特定のフリーランス専用の商品とする場合に選択してください</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">ステータス</label>
                        <select {...register('status')} className="w-full border rounded p-2">
                            <option value="ACTIVE">有効</option>
                            <option value="INACTIVE">無効</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
                        <Button type="submit" variant="primary" isLoading={isLoading}>登録する</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
