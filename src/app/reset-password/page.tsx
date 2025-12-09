import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-blue-600">パスワードリセット</h1>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        パスワードをお忘れの場合は、<br />
                        スタッフまでお問い合わせください。
                    </p>
                </div>

                <Link href="/login">
                    <Button variant="secondary" className="w-full">
                        ログイン画面に戻る
                    </Button>
                </Link>
            </div>
        </div>
    );
}
