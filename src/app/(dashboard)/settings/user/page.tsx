'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "現在のパスワードは必須です"),
    newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください")
        .regex(/[a-zA-Z]/, "英字を含める必要があります")
        .regex(/[0-9]/, "数字を含める必要があります"),
    confirmPassword: z.string().min(1, "パスワード(確認)は必須です"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "新しいパスワードが一致しません",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof passwordSchema>;

export default function UserSettingsPage() {
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(passwordSchema),
    });

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('パスワードを変更しました');
                reset();
            } else {
                const res = await response.json();
                alert(res.error || '変更に失敗しました (現在のパスワードが間違っている可能性があります)');
            }
        } catch (error) {
            alert('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">ユーザー設定</h1>

            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">パスワード変更</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">現在のパスワード <span className="text-red-500">*</span></label>
                        <Input type="password" {...register('currentPassword')} />
                        {errors.currentPassword && <p className="text-red-500 text-sm">{errors.currentPassword.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">新しいパスワード <span className="text-red-500">*</span></label>
                        <Input type="password" {...register('newPassword')} placeholder="英数字8文字以上" />
                        {errors.newPassword && <p className="text-red-500 text-sm">{errors.newPassword.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">新しいパスワード (確認) <span className="text-red-500">*</span></label>
                        <Input type="password" {...register('confirmPassword')} />
                        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
                    </div>

                    <div className="pt-2">
                        <Button type="submit" variant="primary" className="w-full" isLoading={isSaving}>変更する</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
