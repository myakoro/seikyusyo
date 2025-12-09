'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false,
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                username: formData.username,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError('ユーザーIDまたはパスワードが正しくありません');
            } else if (result?.ok) {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('ログインに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-blue-600">スマート受発注 mini</h1>
                    <p className="text-sm text-gray-500 mt-2">請求書管理システム</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        label="ユーザーID"
                        type="text"
                        placeholder="メールアドレスまたはユーザーID"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />

                    <Input
                        label="パスワード"
                        type="password"
                        placeholder="パスワード"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />

                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={formData.rememberMe}
                                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                            />
                            <span>ログイン状態を保持する</span>
                        </label>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            ログイン
                        </Button>
                    </div>

                    <div className="text-center">
                        <Link href="/reset-password" className="text-sm text-blue-600 hover:underline">
                            パスワードを忘れた方
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
