'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

const navigation = [
    { name: 'ダッシュボード', href: '/', icon: '📊' },
    { name: '請求書一覧', href: '/invoices', icon: '📄' },
    { name: 'フリーランス一覧', href: '/freelancers', icon: '👥' },
    { name: '商品マスタ一覧', href: '/products', icon: '📦' },
    { name: '設定', href: '/settings/company', icon: '⚙️' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-gray-800 text-white min-h-screen fixed left-0 top-0 overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-lg font-bold">スマート受発注 mini</h1>
                <p className="text-xs text-gray-400 mt-1">請求書管理システム</p>
            </div>

            <nav className="p-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
