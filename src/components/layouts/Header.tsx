'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function Header() {
    const { data: session } = useSession();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-gray-800">
                {/* Page title will be set by individual pages */}
            </h2>

            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    {session?.user?.name || session?.user?.email}
                </span>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    ログアウト
                </Button>
            </div>
        </header>
    );
}
