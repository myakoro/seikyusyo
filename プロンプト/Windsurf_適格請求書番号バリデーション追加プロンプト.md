# Windsurf UI実装 - 適格請求書発行事業者登録番号のバリデーション追加

## 変更の背景

適格請求書発行事業者登録番号（旧: インボイス番号）に形式バリデーションを追加しました。既に実装を開始している場合は、この変更に対応してください。

---

## 🔴 重要な仕様変更

### 変更内容: 適格請求書発行事業者登録番号の形式バリデーションを追加

**変更前**:
- 任意項目、20文字以内のみチェック

**変更後**:
- 任意項目、**「T」 + 数字13桁の形式チェック**

---

## 📋 バリデーション仕様

### 正しい形式

**形式**: `T` + 数字13桁

**例**: `T1234567890123`

- **T**: 大文字のT（固定）
- **13桁の数字**: 法人番号または個人事業主番号

### 正規表現

```typescript
/^T\d{13}$/
```

---

## 💻 実装方法

### Zodスキーマの更新

#### 変更前

```typescript
const freelancerSchema = z.object({
  // ...
  invoiceNumber: z.string()
    .max(20, '適格請求書発行事業者登録番号は20文字以内で入力してください')
    .optional()
});
```

#### 変更後

```typescript
const freelancerSchema = z.object({
  // ...
  invoiceNumber: z.string()
    .regex(
      /^T\d{13}$/,
      '適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください（例: T1234567890123）'
    )
    .optional()
    .or(z.literal(''))  // 空文字列も許可
});
```

**ポイント**:
- `.optional()` で任意項目
- `.or(z.literal(''))` で空文字列も許可
- 入力がある場合のみ形式チェック

---

## 🎯 修正が必要な箇所

### 1. フリーランス登録画面（SC-09: `/freelancers/new`）

#### バリデーションスキーマ

```typescript
import { z } from 'zod';

const freelancerSchema = z.object({
  name: z.string().min(1, '氏名は必須です').max(200),
  nameKana: z.string().max(200).optional(),
  email: z.string().email('正しいメールアドレスを入力してください'),
  postalCode: z.string().regex(/^\d{7}$/, '郵便番号は7桁の数字で入力してください'),
  address: z.string().min(1, '住所は必須です').max(500),
  phone: z.string().min(1, '電話番号は必須です').max(20),
  
  // 適格請求書発行事業者登録番号（任意、形式チェックあり）
  invoiceNumber: z.string()
    .regex(/^T\d{13}$/, '適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください（例: T1234567890123）')
    .optional()
    .or(z.literal('')),
  
  bankName: z.string().min(1, '銀行名は必須です').max(100),
  bankBranch: z.string().min(1, '支店名は必須です').max(100),
  accountType: z.enum(['ORDINARY', 'CURRENT', 'SAVINGS']),
  accountNumber: z.string().min(1, '口座番号は必須です').max(20),
  accountHolder: z.string().min(1, '口座名義は必須です').max(200),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  withholdingTaxDefault: z.boolean().default(true)
});
```

#### フォーム実装

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    適格請求書発行事業者登録番号
  </label>
  <input
    {...register('invoiceNumber')}
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
    placeholder="T1234567890123"
    maxLength={14}
  />
  {errors.invoiceNumber && (
    <span className="text-red-500 text-sm">
      {errors.invoiceNumber.message}
    </span>
  )}
  <p className="text-xs text-gray-500 mt-1">
    任意項目です。形式: 「T」 + 数字13桁（例: T1234567890123）
  </p>
</div>
```

---

### 2. フリーランス編集画面（SC-10: `/freelancers/[id]/edit`）

SC-09と同様のバリデーションを適用してください。

---

## 🧪 テストケース

### 正常系

| 入力値 | 結果 |
|--------|------|
| `T1234567890123` | ✅ OK |
| `T0000000000000` | ✅ OK |
| `T9999999999999` | ✅ OK |
| （空文字列） | ✅ OK（任意項目） |

### 異常系

| 入力値 | エラーメッセージ |
|--------|----------------|
| `1234567890123` | 適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください |
| `t1234567890123` | 適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください |
| `T123456789012` | 適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください（12桁） |
| `T12345678901234` | 適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください（14桁） |
| `T123456789012A` | 適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください |
| `TA234567890123` | 適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください |

---

## 🎨 UI改善のヒント

### プレースホルダー

```tsx
<input
  placeholder="T1234567890123"
  // ...
/>
```

### ヘルプテキスト

```tsx
<p className="text-xs text-gray-500 mt-1">
  任意項目です。形式: 「T」 + 数字13桁（例: T1234567890123）
</p>
```

### リアルタイムバリデーション（オプション）

```tsx
const watchInvoiceNumber = watch('invoiceNumber');

{watchInvoiceNumber && !/^T\d{13}$/.test(watchInvoiceNumber) && (
  <span className="text-yellow-600 text-sm">
    ⚠️ 形式: 「T」 + 数字13桁
  </span>
)}
```

---

## 📚 参照ドキュメント

詳細は以下の設計書を参照してください：

- **03_画面設計.md** - SC-09の仕様（381行目）
- **05_ビジネスロジック設計.md** - フリーランス登録時のバリデーション（861-868行目）

---

## ✅ チェックリスト

実装時に以下を確認してください：

- [ ] Zodスキーマに正規表現バリデーションを追加
- [ ] エラーメッセージを更新
- [ ] プレースホルダーに例を表示（`T1234567890123`）
- [ ] ヘルプテキストで形式を説明
- [ ] maxLengthを14に設定（T + 13桁）
- [ ] 空文字列を許可（`.or(z.literal(''))`）
- [ ] フリーランス登録画面に適用
- [ ] フリーランス編集画面に適用

---

## 💡 実装例（完全版）

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const freelancerSchema = z.object({
  // ... 他のフィールド
  invoiceNumber: z.string()
    .regex(/^T\d{13}$/, '適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください（例: T1234567890123）')
    .optional()
    .or(z.literal(''))
});

export default function FreelancerForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(freelancerSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... 他のフィールド */}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          適格請求書発行事業者登録番号
        </label>
        <input
          {...register('invoiceNumber')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="T1234567890123"
          maxLength={14}
        />
        {errors.invoiceNumber && (
          <p className="text-red-500 text-sm mt-1">
            {errors.invoiceNumber.message}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          任意項目です。形式: 「T」 + 数字13桁（例: T1234567890123）
        </p>
      </div>
      
      {/* ... */}
    </form>
  );
}
```

---

**この変更により、適格請求書発行事業者登録番号の形式が正しくバリデーションされます。**
