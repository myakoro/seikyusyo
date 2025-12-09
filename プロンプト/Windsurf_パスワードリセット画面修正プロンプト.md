# Windsurf UI実装 - パスワードリセット画面の仕様変更

## 変更の背景

パスワードリセット画面の仕様が変更されました。既に実装を開始している場合は、この変更に対応してください。

---

## 🔴 重要な仕様変更

### 変更内容: パスワードリセット画面をシンプルな案内ページに変更

**変更前**:
- メールアドレス入力フォーム
- 「リセット依頼を送信」ボタン
- バリデーション
- API呼び出し

**変更後**:
- **案内メッセージのみ表示**（フォーム入力なし）
- 「ログイン画面に戻る」ボタンのみ

---

## 📋 修正が必要な箇所

### SC-02: パスワードリセット画面 (`/reset-password`)

#### 実装内容

**シンプルな案内ページ**として実装してください。

```tsx
// app/(auth)/reset-password/page.tsx

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            パスワードをお忘れの方
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 text-base leading-relaxed">
              パスワードをお忘れの場合は、<br />
              スタッフまでお問い合わせください。
            </p>
          </div>
          
          <a
            href="/login"
            className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ログイン画面に戻る
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## ❌ 削除すべき実装

以下の実装は**不要**です。既に実装している場合は削除してください：

### 1. フォーム関連

```tsx
// ❌ 削除
const { register, handleSubmit, formState: { errors } } = useForm();
const schema = z.object({ email: z.string().email() });
```

### 2. API呼び出し

```tsx
// ❌ 削除
const handleResetPassword = async (data) => {
  await fetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

### 3. バリデーション

```tsx
// ❌ 削除
<Input
  {...register('email', { required: true })}
  type="email"
  placeholder="メールアドレス"
/>
{errors.email && <span>エラー</span>}
```

---

## ✅ 実装のポイント

### デザイン

- **シンプルで分かりやすい**案内メッセージ
- **中央配置**のレイアウト
- **青色の背景**で案内メッセージを強調
- **大きめのボタン**でログイン画面に戻りやすく

### アクセシビリティ

```tsx
<div role="alert" className="bg-blue-50 border border-blue-200 rounded-lg p-6">
  <p className="text-gray-700">
    パスワードをお忘れの場合は、<br />
    スタッフまでお問い合わせください。
  </p>
</div>
```

---

## 📚 参照ドキュメント

詳細は以下の設計書を参照してください：

- **03_画面設計.md** - SC-02の仕様（90-115行目）
- **要件定義書.md** - 3.1.4 パスワードリセット（68-71行目）

---

## 🎯 完成イメージ

```
┌─────────────────────────────────────┐
│                                     │
│   パスワードをお忘れの方              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │  パスワードをお忘れの場合は、  │  │
│  │  スタッフまでお問い合わせ      │  │
│  │  ください。                    │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   ログイン画面に戻る           │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ チェックリスト

実装時に以下を確認してください：

- [ ] フォーム入力フィールドを削除
- [ ] バリデーションロジックを削除
- [ ] API呼び出しを削除
- [ ] 案内メッセージを表示
- [ ] 「ログイン画面に戻る」ボタンを実装
- [ ] シンプルで分かりやすいデザイン

---

**この変更により、MVP版ではパスワードリセット機能を実装せず、スタッフへの問い合わせを促す運用になります。**
