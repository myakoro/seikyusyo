'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Create Schema checks
const createFreelancerSchema = z.object({
    name: z.string().min(1, "氏名は必須です"),
    email: z.string().email("有効なメールアドレスを入力してください"),
    username: z.string().min(4, "ユーザー名は4文字以上").regex(/^[a-zA-Z0-9_-]+$/, "半角英数字のみ"),
    password: z.string().min(8, "パスワードは8文字以上"),
    postalCode: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    taxRegistrationNumber: z.string().optional(),
});

type FormData = z.infer<typeof createFreelancerSchema>;

export default function FreelancerCreatePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(createFreelancerSchema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/freelancers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('フリーランスを登録しました');
                router.push('/freelancers');
            } else {
                const result = await response.json();
                alert(result.error || '登録に失敗しました');
            }
        } catch (error) {
            alert('エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">フリーランス新規登録</h1>

            <Card className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-semibold mb-4">アカウント情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">ユーザー名 <span className="text-red-500">*</span></label>
                                <Input {...register('username')} placeholder="taro_yamada" />
                                {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">メールアドレス <span className="text-red-500">*</span></label>
                                <Input type="email" {...register('email')} placeholder="taro@example.com" />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">初期パスワード <span className="text-red-500">*</span></label>
                                <Input type="password" {...register('password')} placeholder="8文字以上" />
                                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4">基本プロフィール</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">氏名 <span className="text-red-500">*</span></label>
                                <Input {...register('name')} placeholder="山田 太郎" />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">電話番号</label>
                                    <Input {...register('phoneNumber')} placeholder="090-1234-5678" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">郵便番号</label>
                                    <Input {...register('postalCode')} placeholder="123-4567" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">住所</label>
                                <Input {...register('address')} placeholder="東京都..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">インボイス登録番号</label>
                                <Input {...register('taxRegistrationNumber')} placeholder="T1234567890123" />
                            </div>
                        </div>
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
