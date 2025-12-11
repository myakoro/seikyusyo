'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const companySchema = z.object({
    name: z.string().min(1, "会社名は必須です"),
    postalCode: z.string().optional(),
    address: z.string().min(1, "住所は必須です"),
    phoneNumber: z.string().optional(),
    email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
    registrationNumber: z.string().regex(/^T\d{13}$/, "適格請求書登録番号の形式が正しくありません(T+13桁)").optional().or(z.literal("")),
    bankName: z.string().optional(),
    bankBranch: z.string().optional(),
    accountType: z.enum(["ORDINARY", "CURRENT", "SAVINGS"]).optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
});

type FormData = z.infer<typeof companySchema>;

export default function CompanySettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            accountType: "ORDINARY"
        }
    });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const response = await fetch('/api/company');
                if (response.ok) {
                    const data = await response.json();
                    // Reset form with fetched data
                    // Handle nulls by defaulting to empty strings for inputs
                    reset({
                        name: data.name || '',
                        postalCode: data.postalCode || '',
                        address: data.address || '',
                        phoneNumber: data.phoneNumber || '',
                        email: data.email || '',
                        registrationNumber: data.registrationNumber || '',
                        bankName: data.bankName || '',
                        bankBranch: data.bankBranch || '',
                        accountType: data.accountType || 'ORDINARY',
                        accountNumber: data.accountNumber || '',
                        accountHolder: data.accountHolder || '',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch company settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompany();
    }, [reset]);

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('会社情報を更新しました');
            } else {
                const res = await response.json();
                alert(`Error: ${res.error}\nMessage: ${res.message}\n${res.stack || ''}`);
            }
        } catch (error) {
            alert('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">自社情報設定</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">基本情報</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">会社名 <span className="text-red-500">*</span></label>
                            <Input {...register('name')} placeholder="株式会社〇〇" />
                            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">インボイス登録番号</label>
                            <Input {...register('registrationNumber')} placeholder="T1234567890123" />
                            {errors.registrationNumber && <p className="text-red-500 text-sm">{errors.registrationNumber.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">メールアドレス</label>
                            <Input {...register('email')} placeholder="info@example.com" />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">電話番号</label>
                            <Input {...register('phoneNumber')} placeholder="03-1234-5678" />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1">郵便番号</label>
                                <Input {...register('postalCode')} placeholder="100-0000" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">住所 <span className="text-red-500">*</span></label>
                                <Input {...register('address')} placeholder="東京都..." />
                                {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">振込口座情報</h2>
                    <p className="text-sm text-gray-500 mb-4">請求書に記載される振込先口座情報です。</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">金融機関名</label>
                            <Input {...register('bankName')} placeholder="〇〇銀行" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">支店名</label>
                            <Input {...register('bankBranch')} placeholder="〇〇支店" />
                        </div>

                        <div className="grid grid-cols-3 gap-2 md:col-span-2">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1">預金種別</label>
                                <select {...register('accountType')} className="w-full border rounded p-2 text-sm bg-white">
                                    <option value="ORDINARY">普通</option>
                                    <option value="CURRENT">当座</option>
                                    <option value="SAVINGS">貯蓄</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">口座番号</label>
                                <Input {...register('accountNumber')} placeholder="1234567" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">口座名義 (カナ)</label>
                            <Input {...register('accountHolder')} placeholder="カ）〇〇" />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>保存する</Button>
                </div>
            </form>
        </div>
    );
}
