'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    unitPrice: number;
    taxType: string;
    withholdingTaxTarget: boolean;
    freelancer?: { name: string };
    status: string;
}

export default function ProductListPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('この商品を無効化してもよろしいですか？')) return;

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('無効化しました');
                fetchProducts();
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
                    <h1 className="text-3xl font-bold text-gray-900">商品一覧</h1>
                    <p className="text-gray-600 mt-2">請求書で使用する商品の管理</p>
                </div>
                <Link href="/products/new">
                    <Button variant="primary">➕ 新規登録</Button>
                </Link>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase border-b">
                            <tr>
                                <th className="px-6 py-3">商品名</th>
                                <th className="px-6 py-3 text-right">単価</th>
                                <th className="px-6 py-3 text-center">消費税</th>
                                <th className="px-6 py-3 text-center">源泉税</th>
                                <th className="px-6 py-3">関連フリーランス</th>
                                <th className="px-6 py-3">ステータス</th>
                                <th className="px-6 py-3 text-right">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 text-right">¥{formatCurrency(product.unitPrice)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {product.taxType === 'INCLUSIVE' ? '内税' : '外税'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {product.withholdingTaxTarget ? '対象' : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.freelancer?.name || <span className="text-gray-400">共通</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.status === 'ACTIVE' ? (
                                            <Badge variant="approved">有効</Badge>
                                        ) : (
                                            <Badge variant="rejected">無効</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Link href={`/products/${product.id}/edit`}>
                                            <Button variant="secondary" size="sm">編集</Button>
                                        </Link>
                                        {product.status === 'ACTIVE' && (
                                            <Button variant="danger" size="sm" onClick={() => handleDeactivate(product.id)}>無効化</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        登録されている商品はありません
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
