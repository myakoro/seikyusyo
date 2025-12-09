'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const updateFreelancerSchema = z.object({
    name: z.string().min(1, "氏名は必須です"),
    postalCode: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    taxRegistrationNumber: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormData = z.infer<typeof updateFreelancerSchema>;

export default function FreelancerEditPage() {
    const router = useRouter();
    const { id } = useParams();
    const freelancerId = Array.isArray(id) ? id[0] : id;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(updateFreelancerSchema),
    });

    useEffect(() => {
        const fetchFreelancer = async () => {
            try {
                const response = await fetch(`/api/freelancers/${freelancerId}`);
                if (response.ok) {
                    const data = await response.json();
                    reset({
                        name: data.name,
                        postalCode: data.postalCode || '',
                        address: data.address || '',
                        phoneNumber: data.phoneNumber || '',
                        taxRegistrationNumber: data.taxRegistrationNumber || '',
                        status: data.status,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFreelancer();
    }, [freelancerId, reset]);

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/freelancers/${freelancerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('更新しました');
                router.push('/freelancers');
            } else {
                alert('更新に失敗しました');
            }
        } catch (error) {
            alert('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">フリーランス編集</h1>

            <Card className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-4">基本プロフィール</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">氏名 <span className="text-red-500">*</span></label>
                                <Input {...register('name')} />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">電話番号</label>
                                    <Input {...register('phoneNumber')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">郵便番号</label>
                                    <Input {...register('postalCode')} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">住所</label>
                                <Input {...register('address')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">インボイス登録番号</label>
                                <Input {...register('taxRegistrationNumber')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">ステータス</label>
                                <select {...register('status')} className="w-full border rounded p-2">
                                    <option value="ACTIVE">有効</option>
                                    <option value="INACTIVE">無効</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
                        <Button type="submit" variant="primary" isLoading={isSaving}>更新する</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
