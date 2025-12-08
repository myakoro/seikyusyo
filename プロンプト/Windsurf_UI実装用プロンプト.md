# Windsurf UI実装用プロンプト

## あなたの役割

あなたは**フロントエンドエンジニア**です。以下の設計書に基づいて、「スマート受発注 mini」（請求書発行システム）のUIを実装してください。

**あなたの責任範囲：**
- Next.js (App Router) を使用したフロントエンド実装
- React コンポーネントの作成
- Tailwind CSS によるスタイリング
- フォーム管理（React Hook Form + Zod）
- クライアントサイドのバリデーション
- 画面遷移の実装

**あなたの責任範囲外（他のツールが担当）：**
- バックエンドAPI実装 → Anthropic（Claude）が担当
- データベース設計 → 既に完了
- ビジネスロジック → Anthropic（Claude）が担当

---

## 前提条件

### 技術スタック

**必須技術**
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **UIライブラリ**: React 18+
- **スタイリング**: Tailwind CSS
- **フォーム管理**: React Hook Form
- **バリデーション**: Zod
- **日付処理**: date-fns

**推奨ライブラリ**
- **トースト通知**: react-hot-toast
- **アイコン**: lucide-react または heroicons
- **テーブル**: @tanstack/react-table（オプション）

### 開発環境
- **OS**: Windows
- **対応ブラウザ**: Google Chrome（最新版）
- **バージョン管理**: GitHub
- **デプロイ先**: Render

---

## 参照すべき設計書

### 要件定義書
```
C:\Users\takuy\Desktop\請求書発行システム\要件定義書\要件定義書.md
```

### 詳細設計書（以下のディレクトリ内）
```
C:\Users\takuy\Desktop\請求書発行システム\詳細設計書\
```

**必読ドキュメント**
1. **README.md** - 全体像の把握
2. **01_システム前提条件・構成.md** - 技術スタック、ディレクトリ構成
3. **03_画面設計.md** - 画面仕様（最重要）
4. **02_データベース設計.md** - データ構造の理解
5. **04_API設計.md** - API連携の理解

---

## 実装してほしい内容

### フェーズ1: プロジェクトセットアップ

#### 1. Next.jsプロジェクト作成

```bash
npx create-next-app@latest smart-order-mini --typescript --tailwind --app --no-src
cd smart-order-mini
```

**設定オプション**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- Import alias: Yes (@/*)

#### 2. 必要なパッケージのインストール

```bash
npm install react-hook-form zod @hookform/resolvers
npm install date-fns
npm install react-hot-toast
npm install lucide-react
npm install @prisma/client
npm install next-auth@beta
```

#### 3. ディレクトリ構成の作成

以下のディレクトリ構造を作成してください（`01_システム前提条件・構成.md`の1.4参照）：

```
smart-order-mini/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── reset-password/
│   ├── (dashboard)/
│   │   ├── invoices/
│   │   ├── freelancers/
│   │   ├── products/
│   │   └── settings/
│   ├── api/          # API Routesは後でClaudeが実装
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   └── layouts/
├── lib/
└── types/
```

---

### フェーズ2: 共通コンポーネントの実装

#### 1. レイアウトコンポーネント

**作成するファイル**
- `components/layouts/Header.tsx` - ヘッダー（ナビゲーション、ユーザー名、ログアウト）
- `components/layouts/Sidebar.tsx` - サイドバー（メニュー）
- `components/layouts/DashboardLayout.tsx` - ダッシュボード用レイアウト

**要件**
- ヘッダーには全画面共通のナビゲーションメニューを配置
- ログイン中のユーザー名を表示
- ログアウトボタンを配置
- レスポンシブデザイン（モバイル対応）

#### 2. UIコンポーネント

**作成するファイル**
- `components/ui/Button.tsx` - ボタンコンポーネント
- `components/ui/Input.tsx` - 入力フィールド
- `components/ui/Select.tsx` - セレクトボックス
- `components/ui/Table.tsx` - テーブル
- `components/ui/Modal.tsx` - モーダルダイアログ
- `components/ui/Toast.tsx` - トースト通知
- `components/ui/Badge.tsx` - ステータスバッジ
- `components/ui/Card.tsx` - カード

**デザイン要件**
- モダンで洗練されたデザイン
- アクセシビリティ対応（ARIA属性）
- ホバー・フォーカス状態のスタイリング
- ローディング状態の表示

---

### フェーズ3: 認証画面の実装

#### SC-01: ログイン画面 (`app/(auth)/login/page.tsx`)

**参照**: `03_画面設計.md` の「SC-01: ログイン画面」

**実装内容**
- ユーザーID（email/username）入力フィールド
- パスワード入力フィールド
- 「ログイン状態を保持」チェックボックス
- ログインボタン
- 「パスワードを忘れた方」リンク

**バリデーション（Zod）**
```typescript
const loginSchema = z.object({
  username: z.string().min(1, 'ユーザーIDを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
  rememberMe: z.boolean().optional()
});
```

**デザイン**
- 中央配置のログインフォーム
- シンプルで使いやすいUI
- エラーメッセージの表示

#### SC-02: パスワードリセット画面 (`app/(auth)/reset-password/page.tsx`)

**参照**: `03_画面設計.md` の「SC-02: パスワードリセット画面」

**実装内容**
- メールアドレス入力フィールド
- リセット依頼送信ボタン

---

### フェーズ4: ダッシュボード画面の実装

#### SC-03: ダッシュボード (`app/(dashboard)/page.tsx`)

**参照**: `03_画面設計.md` の「SC-03: ダッシュボード」

**実装内容**
- サマリーカード（今月の請求書件数、請求額合計、支払予定件数）
- 最近の請求書一覧（最新5件）
- クイックアクションボタン（新規請求書作成、フリーランス登録）

**デザイン**
- グリッドレイアウト
- カードベースのUI
- 数値の見やすい表示

---

### フェーズ5: 請求書管理画面の実装

#### SC-04: 請求書一覧 (`app/(dashboard)/invoices/page.tsx`)

**参照**: `03_画面設計.md` の「SC-04: 請求書一覧」

**実装内容**
- 検索フォーム（ステータス、フリーランス名、作成者、日付範囲）
- 一覧テーブル（請求書番号、フリーランス名、請求締日、支払予定日、請求額、ステータス）
- ソート機能
- ページネーション
- アクションボタン（詳細、編集、複製、削除、PDF出力）

**テーブルカラム**
- 請求書番号
- フリーランス名
- 請求締日
- 支払予定日
- 請求額（右寄せ、カンマ区切り）
- ステータス（バッジ表示）
- アクション

#### SC-05: 請求書作成 (`app/(dashboard)/invoices/new/page.tsx`)

**参照**: `03_画面設計.md` の「SC-05: 請求書作成」

**実装内容**

**基本情報セクション**
- フリーランス選択（セレクトボックス）
- 請求締日（日付入力、デフォルト: 前月末）
- 支払予定日（日付入力、デフォルト: 締日の翌月末）

**発注者・受注者情報セクション**
- 自社情報表示（読み取り専用）
- フリーランス情報表示（読み取り専用）

**明細テーブルセクション**
- 動的な明細行（追加・削除可能）
- カラム: 商品名、単価、個数、報酬率、消費税、消費税率、源泉税対象、金額
- 「明細行を追加」ボタン
- 「行を削除」ボタン

**集計セクション**
- 小計（税別）
- 内、源泉税対象小計（税別）
- 合計（税込）
- 源泉所得税
- **請求額（税込）**（強調表示）

**備考セクション**
- テキストエリア（1000文字以内）

**アクションボタン**
- 下書き保存
- 確定
- キャンセル

**バリデーション**
- 明細が1行以上必要
- 金額が0円の明細は不可
- 請求締日 ≤ 支払予定日

**リアルタイム計算**
- 明細入力時に金額を自動計算
- 集計を自動更新

#### SC-06: 請求書編集 (`app/(dashboard)/invoices/[id]/edit/page.tsx`)

**参照**: `03_画面設計.md` の「SC-06: 請求書編集」

**実装内容**
- SC-05と同様のフォーム
- 既存データの読み込み
- 編集制限の実装（承認待ち中の編集で下書きに戻る警告）

#### SC-07: 請求書詳細 (`app/(dashboard)/invoices/[id]/page.tsx`)

**参照**: `03_画面設計.md` の「SC-07: 請求書詳細」

**実装内容**
- 請求書情報の表示（読み取り専用）
- ステータスバッジ
- 明細テーブル
- 集計表示
- ステータス変更履歴
- アクションボタン（編集、複製、削除、PDF出力、支払済にする、承認、差し戻し）

**ロール別表示**
- 自社ユーザー: 編集、複製、削除、PDF出力、支払済にする
- フリーランス: 承認、差し戻し、PDF出力

---

### フェーズ6: フリーランス管理画面の実装

#### SC-08: フリーランス一覧 (`app/(dashboard)/freelancers/page.tsx`)

**参照**: `03_画面設計.md` の「SC-08: フリーランス一覧」

#### SC-09: フリーランス登録 (`app/(dashboard)/freelancers/new/page.tsx`)

**参照**: `03_画面設計.md` の「SC-09: フリーランス登録」

**実装内容**
- 基本情報入力フォーム
- 振込先情報入力フォーム
- 登録ボタン
- 登録完了時の招待文テンプレート表示（モーダル）

#### SC-10: フリーランス編集 (`app/(dashboard)/freelancers/[id]/edit/page.tsx`)

**参照**: `03_画面設計.md` の「SC-10: フリーランス編集」

---

### フェーズ7: 商品マスタ管理画面の実装

#### SC-11: 商品マスタ一覧 (`app/(dashboard)/products/page.tsx`)

**参照**: `03_画面設計.md` の「SC-11: 商品マスタ一覧」

#### SC-12: 商品マスタ登録 (`app/(dashboard)/products/new/page.tsx`)

**参照**: `03_画面設計.md` の「SC-12: 商品マスタ登録」

#### SC-13: 商品マスタ編集 (`app/(dashboard)/products/[id]/edit/page.tsx`)

**参照**: `03_画面設計.md` の「SC-13: 商品マスタ編集」

---

### フェーズ8: 設定画面の実装

#### SC-14: 自社情報設定 (`app/(dashboard)/settings/company/page.tsx`)

**参照**: `03_画面設計.md` の「SC-14: 自社情報設定」

#### SC-15: ユーザー管理 (`app/(dashboard)/settings/users/page.tsx`)

**参照**: `03_画面設計.md` の「SC-15: ユーザー管理」

---

### フェーズ9: フリーランス用画面の実装

#### SC-16: マイページ (`app/(dashboard)/mypage/page.tsx`)

**参照**: `03_画面設計.md` の「SC-16: マイページ」

---

## デザインガイドライン

### カラーパレット

**プライマリカラー**
- Primary: `#3B82F6` (青)
- Secondary: `#10B981` (緑)
- Danger: `#EF4444` (赤)
- Warning: `#F59E0B` (オレンジ)

**ステータスカラー**
- 下書き: グレー (`#6B7280`)
- 承認待ち: 黄色 (`#F59E0B`)
- 差し戻し: 赤 (`#EF4444`)
- 承認済: 緑 (`#10B981`)
- 支払済: 青 (`#3B82F6`)

### タイポグラフィ

- **見出し**: font-bold, text-2xl / text-xl / text-lg
- **本文**: font-normal, text-base
- **小さいテキスト**: text-sm / text-xs

### スペーシング

- **セクション間**: mb-8 / mb-6
- **要素間**: mb-4 / mb-2
- **パディング**: p-6 / p-4

### レスポンシブデザイン

- **モバイル**: デフォルト
- **タブレット**: md: (768px以上)
- **デスクトップ**: lg: (1024px以上)

---

## 重要な実装ポイント

### 1. フォームバリデーション

**React Hook Form + Zod を使用**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  email: z.string().email('正しいメールアドレスを入力してください')
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### 2. API連携

**fetch を使用（Next.js標準）**

```typescript
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

if (!response.ok) {
  const error = await response.json();
  toast.error(error.error.message);
  return;
}

const result = await response.json();
toast.success('請求書を作成しました');
```

### 3. エラー表示

**react-hot-toast を使用**

```typescript
import toast from 'react-hot-toast';

// 成功
toast.success('保存しました');

// エラー
toast.error('エラーが発生しました');

// 警告
toast('確認してください', { icon: '⚠️' });
```

### 4. ローディング状態

**useState でローディング状態を管理**

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await fetch(...);
  } finally {
    setIsLoading(false);
  }
};

<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### 5. 日付フォーマット

**date-fns を使用**

```typescript
import { format } from 'date-fns';

const formattedDate = format(new Date(), 'yyyy-MM-dd');
const displayDate = format(new Date(), 'yyyy年MM月dd日');
```

### 6. 金額フォーマット

**toLocaleString を使用**

```typescript
const formattedAmount = amount.toLocaleString('ja-JP');
// 例: 100000 → "100,000"
```

---

## 注意事項

### やってはいけないこと

1. **バックエンドロジックを実装しない**
   - API Routesの実装はClaudeが担当
   - フロントエンドはAPIを呼び出すだけ

2. **データベース操作を直接行わない**
   - Prismaクライアントの使用はバックエンドのみ

3. **ビジネスロジックをフロントエンドに書かない**
   - 金額計算などはバックエンドAPIで実行
   - フロントエンドは表示用の計算のみ（プレビュー）

### やるべきこと

1. **設計書に忠実に実装する**
   - `03_画面設計.md`の仕様を厳守
   - 表示項目、バリデーション、ボタン・アクションを正確に実装

2. **TypeScriptの型を適切に定義する**
   - `types/`ディレクトリに型定義を作成
   - API レスポンスの型を定義

3. **アクセシビリティを考慮する**
   - ARIA属性を適切に使用
   - キーボード操作に対応

4. **エラーハンドリングを適切に行う**
   - ユーザーフレンドリーなエラーメッセージ
   - トースト通知で通知

---

## 開発の進め方

### ステップ1: プロジェクトセットアップ
1. Next.jsプロジェクト作成
2. 必要なパッケージインストール
3. ディレクトリ構成作成
4. Tailwind CSS設定

### ステップ2: 共通コンポーネント作成
1. レイアウトコンポーネント
2. UIコンポーネント
3. フォームコンポーネント

### ステップ3: 認証画面実装
1. ログイン画面
2. パスワードリセット画面

### ステップ4: ダッシュボード実装
1. ダッシュボード画面

### ステップ5: 請求書管理実装
1. 請求書一覧
2. 請求書作成
3. 請求書編集
4. 請求書詳細

### ステップ6: マスタ管理実装
1. フリーランス管理
2. 商品マスタ管理

### ステップ7: 設定画面実装
1. 自社情報設定
2. ユーザー管理

### ステップ8: フリーランス用画面実装
1. マイページ

---

## 質問・不明点がある場合

以下のドキュメントを参照してください：

1. **画面仕様の詳細**: `03_画面設計.md`
2. **データ構造**: `02_データベース設計.md`
3. **API仕様**: `04_API設計.md`
4. **技術スタック**: `01_システム前提条件・構成.md`

不明点があれば、設計書の該当箇所を確認してから質問してください。

---

## 成果物

以下を作成してください：

1. **Next.jsプロジェクト** (`smart-order-mini/`)
2. **全16画面のUIコンポーネント**
3. **共通UIコンポーネント**
4. **型定義ファイル** (`types/`)
5. **README.md** (セットアップ手順、開発方法)

---

**それでは、モダンで使いやすいUIの実装をお願いします！**
