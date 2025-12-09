# Windsurf UI実装プロンプト - 請求書発行システム

## 🎯 あなたの役割

あなたは**フロントエンドエンジニア**です。「請求書発行システム」の残りのUI（全14画面）を実装してください。

**既に実装済み:**
- ✅ ログイン画面 (SC-01)
- ✅ パスワードリセット画面 (SC-02)
- ✅ 共通UIコンポーネント (Button, Input, Card, Badge)
- ✅ 認証設定 (NextAuth.js)
- ✅ Tailwind CSS環境

**これから実装してほしい内容:**
- ❌ ダッシュボード (SC-03)
- ❌ 請求書管理 (SC-04〜07)
- ❌ フリーランス管理 (SC-08〜10)
- ❌ 商品マスタ管理 (SC-11〜13)
- ❌ 設定・マイページ (SC-14〜16)

---

## 📁 参照すべきファイル

### 必読ドキュメント（優先順）
1. **`詳細設計書/03_画面設計.md`** ← 最重要！全画面の仕様
2. **`mockup/`フォルダ内のHTML** ← デザインの参考
3. **`詳細設計書/04_API設計.md`** ← API仕様
4. **`プロンプト/Windsurf_UI実装用プロンプト.md`** ← 詳細な実装ガイド

### 既存の実装（参考にしてください）
- `src/app/login/page.tsx` ← ログイン画面の実装例
- `src/components/ui/Button.tsx` ← 共通コンポーネントの使い方
- `src/lib/utils.ts` ← ユーティリティ関数

---

## 🚀 実装してほしい画面（優先順）

### Phase 2: ダッシュボード & 請求書管理（最優先）

#### 1. レイアウトコンポーネント
**ファイル:** `src/components/layouts/`

**作成するファイル:**
- `Header.tsx` - ヘッダー（ユーザー名表示、ログアウトボタン）
- `Sidebar.tsx` - サイドバーナビゲーション
- `DashboardLayout.tsx` - ダッシュボード用レイアウト

**デザイン参考:** `mockup/SC-03_dashboard.html`

**要件:**
- ヘッダーには「スマート受発注 mini」ロゴ
- サイドバーには以下のメニュー:
  - ダッシュボード
  - 請求書一覧
  - フリーランス一覧
  - 商品マスタ一覧
  - 設定
- ログアウトボタン（`signOut()` を呼び出す）

#### 2. SC-03: ダッシュボード
**ファイル:** `src/app/(dashboard)/page.tsx`

**参照:**
- 設計書: `詳細設計書/03_画面設計.md` の「SC-03: ダッシュボード」
- モックアップ: `mockup/SC-03_dashboard.html`

**表示内容:**
- サマリーカード（3つ）:
  - 今月の請求書件数
  - 今月の請求額合計
  - 支払予定件数
- 最近の請求書一覧（最新5件）
- クイックアクションボタン

**API呼び出し:**
```typescript
// ダッシュボードデータ取得
const response = await fetch('/api/dashboard');
const data = await response.json();
```

#### 3. SC-04: 請求書一覧
**ファイル:** `src/app/(dashboard)/invoices/page.tsx`

**参照:**
- 設計書: `詳細設計書/03_画面設計.md` の「SC-04: 請求書一覧」
- モックアップ: `mockup/SC-04_invoice-list.html`

**実装内容:**
- 検索フォーム（ステータス、フリーランス名、日付範囲）
- テーブル表示（請求書番号、フリーランス名、請求額、ステータス）
- ページネーション
- アクションボタン（詳細、編集、削除、PDF出力）

**新規コンポーネント:**
- `src/components/ui/Table.tsx` を作成してください

#### 4. SC-05: 請求書作成
**ファイル:** `src/app/(dashboard)/invoices/new/page.tsx`

**参照:**
- 設計書: `詳細設計書/03_画面設計.md` の「SC-05: 請求書作成」
- モックアップ: `mockup/SC-05_invoice-new.html`

**実装内容:**
- フリーランス選択
- 請求締日、支払予定日
- 動的な明細テーブル（行の追加・削除）
- リアルタイム金額計算（フロントエンド表示用）
- 集計表示（小計、消費税、源泉税、請求額）
- 下書き保存・確定ボタン

**重要:**
- React Hook Form + Zod でバリデーション
- 明細行は `useFieldArray` を使用
- 金額計算は `src/lib/calculations.ts` に関数を作成

#### 5. SC-06: 請求書編集
**ファイル:** `src/app/(dashboard)/invoices/[id]/edit/page.tsx`

SC-05とほぼ同じフォーム。既存データを読み込んで表示。

#### 6. SC-07: 請求書詳細
**ファイル:** `src/app/(dashboard)/invoices/[id]/page.tsx`

**参照:**
- 設計書: `詳細設計書/03_画面設計.md` の「SC-07: 請求書詳細」
- モックアップ: `mockup/SC-07_invoice-detail.html`

**実装内容:**
- 請求書情報の表示（読み取り専用）
- ステータスバッジ
- ステータス変更履歴
- アクションボタン（ロール別に表示切り替え）

---

### Phase 3: マスタデータ管理

#### 7-9. フリーランス管理 (SC-08〜10)
**ファイル:**
- `src/app/(dashboard)/freelancers/page.tsx` (一覧)
- `src/app/(dashboard)/freelancers/new/page.tsx` (登録)
- `src/app/(dashboard)/freelancers/[id]/edit/page.tsx` (編集)

**参照:** `詳細設計書/03_画面設計.md` の SC-08〜10

#### 10-12. 商品マスタ管理 (SC-11〜13)
**ファイル:**
- `src/app/(dashboard)/products/page.tsx` (一覧)
- `src/app/(dashboard)/products/new/page.tsx` (登録)
- `src/app/(dashboard)/products/[id]/edit/page.tsx` (編集)

**参照:** `詳細設計書/03_画面設計.md` の SC-11〜13

---

### Phase 4: 設定・マイページ

#### 13-14. 設定 (SC-14〜15)
**ファイル:**
- `src/app/(dashboard)/settings/company/page.tsx` (自社情報)
- `src/app/(dashboard)/settings/users/page.tsx` (ユーザー管理)

#### 15. マイページ (SC-16)
**ファイル:**
- `src/app/(dashboard)/mypage/page.tsx`

---

## 🎨 デザインガイドライン

### カラーパレット
```css
--primary: #3b82f6 (青)
--secondary: #10b981 (緑)
--danger: #ef4444 (赤)
--warning: #f59e0b (オレンジ)
```

### ステータスバッジ
- 下書き: グレー
- 承認待ち: 黄色
- 差し戻し: 赤
- 承認済: 緑
- 支払済: 青

### 既存コンポーネントの使用
```tsx
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
```

---

## 📝 実装のポイント

### 1. 認証保護
ダッシュボード配下の全ページは認証が必要です。

**layout.tsx で認証チェック:**
```tsx
// src/app/(dashboard)/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');
  
  return (
    <div>
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### 2. API呼び出し
```tsx
// データ取得例
const response = await fetch('/api/invoices');
const invoices = await response.json();

// データ送信例
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});
```

### 3. フォームバリデーション
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  email: z.string().email('正しいメールアドレスを入力してください'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### 4. 日付・金額フォーマット
```tsx
import { formatCurrency, formatDate } from '@/lib/utils';

// 金額: 100000 → "100,000"
<span>{formatCurrency(amount)}</span>

// 日付: Date → "2024/12/09"
<span>{formatDate(date)}</span>
```

---

## ⚠️ 注意事項

### やってはいけないこと
- ❌ バックエンドAPI（`src/app/api/`）の実装 → Claudeが担当
- ❌ データベース操作 → Prismaは使わない
- ❌ ビジネスロジック → APIに任せる

### やるべきこと
- ✅ UIコンポーネントの実装
- ✅ フォームバリデーション
- ✅ API呼び出し
- ✅ エラーハンドリング
- ✅ ローディング状態の表示

---

## 🎯 優先順位

**最優先で実装してほしい順:**
1. レイアウトコンポーネント (Header, Sidebar, DashboardLayout)
2. ダッシュボード (SC-03)
3. 請求書一覧 (SC-04)
4. 請求書作成 (SC-05)
5. 請求書詳細 (SC-07)

これらが完成すれば、基本的な請求書管理フローが動作します。

---

## 📦 成果物

以下を作成してください:
- 全14画面のUIコンポーネント
- レイアウトコンポーネント (Header, Sidebar, DashboardLayout)
- 追加の共通UIコンポーネント (Table, Select, Modal など)
- バリデーションスキーマ (`src/lib/validations/`)
- ユーティリティ関数 (`src/lib/calculations.ts` など)

---

**それでは、モダンで使いやすいUIの実装をお願いします！**
