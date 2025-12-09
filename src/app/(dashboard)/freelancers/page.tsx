'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils'; // Keep import for potential future use or remove if unused

interface Freelancer {
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    status: string;
    user?: { email: string; username: string };
    createdAt: string;
}

export default function FreelancerListPage() {
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFreelancers();
    }, []);

    const fetchFreelancers = async () => {
        try {
            const response = await fetch('/api/freelancers');
            if (response.ok) {
                const data = await response.json();
                setFreelancers(data.freelancers || []);
            }
        } catch (error) {
            console.error('Failed to fetch freelancers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('このフリーランスを無効化（論理削除）しますか？')) return;

        try {
            const response = await fetch(`/api/freelancers/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('無効化しました');
                fetchFreelancers();
            } else {
                alert('無効化に失敗しました');
            }
        } catch (error) {
            alert('エラーが発生しました');
        }
    };

    if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">フリーランス一覧</h1>
                    <p className="text-gray-600 mt-2">登録済みフリーランスの管理</p>
                </div>
                <Link href="/freelancers/new">
                    <Button variant="primary">➕ 新規登録</Button>
                </Link>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase border-b">
                            <tr>
                                <th className="px-6 py-3">氏名</th>
                                <th className="px-6 py-3">ユーザー情報</th>
                                <th className="px-6 py-3">連絡先</th>
                                <th className="px-6 py-3">ステータス</th>
                                <th className="px-6 py-3 text-right">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {freelancers.map((fl) => (
                                <tr key={fl.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{fl.name}</td>
                                    <td className="px-6 py-4">
                                        {fl.user ? (
                                            <div>
                                                <div className="font-medium">{fl.user.username}</div>
                                                <div className="text-gray-500 text-xs">{fl.user.email}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">未連携</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{fl.phoneNumber || '-'}</td>
                                    <td className="px-6 py-4">
                                        {fl.status === 'ACTIVE' ? (
                                            <Badge variant="approved">有効</Badge>
                                        ) : (
                                            <Badge variant="rejected">無効</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Link href={`/freelancers/${fl.id}/edit`}>
                                            <Button variant="secondary" size="sm">編集</Button>
                                        </Link>
                                        {fl.status === 'ACTIVE' && (
                                            <Button variant="danger" size="sm" onClick={() => handleDeactivate(fl.id)}>無効化</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {freelancers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        登録されているフリーランスはいません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
