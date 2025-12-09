'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Schema matches Freelancer update (SC-10) but without internal status
const myPageSchema = z.object({
    name: z.string().min(1, "氏名は必須です"),
    postalCode: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    taxRegistrationNumber: z.string().optional(),
});

type FormData = z.infer<typeof myPageSchema>;

export default function MyPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [freelancerId, setFreelancerId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(myPageSchema),
    });

    useEffect(() => {
        const fetchMyData = async () => {
            try {
                // Fetch current user's freelancer profile
                // Since we don't have a direct /api/freelancers/me, we need to ensure the backend supports this
                // OR we use the session user ID to find it if filtering is allowed.
                // Let's assume we need to implement a "me" endpoint or query param?
                // Actually, let's implement a specific GET handler for logged in user in the fetch or use a query.
                // BUT, looking at /api/freelancers implementation, it only returns list for COMPANY.
                // We need a way for Freelancer to get THEIR OWN data.

                // Let's rely on a new endpoint or update logic.
                // Wait, better approach: Create /api/profile endpoint? 
                // Or reuse /api/freelancers/[id] but we need to know the ID first.
                // Solution: Create /api/me/freelancer endpoint for simplicity here? 
                // No, let's stick to using /api/freelancers/me which we can implement in [id] route by checking param "me".

                const response = await fetch('/api/freelancers/me');
                if (response.ok) {
                    const data = await response.json();
                    setFreelancerId(data.id);
                    reset({
                        name: data.name,
                        postalCode: data.postalCode || '',
                        address: data.address || '',
                        phoneNumber: data.phoneNumber || '',
                        taxRegistrationNumber: data.taxRegistrationNumber || '',
                    });
                } else {
                    // Maybe not found or not a freelancer account
                    console.error("Profile load failed");
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyData();
    }, [reset]);

    const onSubmit = async (data: FormData) => {
        if (!freelancerId) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/freelancers/${freelancerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('プロフィールを更新しました');
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
    if (!freelancerId) return <div className="p-8 text-center">フリーランスプロフィールが見つかりません</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">マイページ</h1>

            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">プロフィール編集</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" variant="primary" isLoading={isSaving}>保存する</Button>
                    </div>
                </form>
            </Card>

            <div className="mt-6 text-right">
                <Button variant="secondary" onClick={() => window.location.href = '/settings/user'}>
                    パスワード変更はこちら
                </Button>
            </div>
        </div>
    );
}
