# Windsurf UI実装 - 自社情報設定の必須項目変更

## 変更の背景

自社情報設定画面の必須項目が変更されました。既に実装を開始している場合は、この変更に対応してください。

---

## 🔴 重要な仕様変更

### 変更内容: ほぼ全ての項目を必須に変更

**任意項目（必須ではない）**:
- その他情報

**必須項目（○）**:
- 会社名（元から必須）
- **郵便番号** ← 変更
- **住所** ← 変更
- **電話番号** ← 変更
- **メールアドレス** ← 変更

---

## 📋 修正が必要な箇所

### SC-14: 自社情報設定画面 (`/settings/company`)

#### バリデーションスキーマの更新

**Zodスキーマ例**:

```typescript
import { z } from 'zod';

const companyInfoSchema = z.object({
  // 必須項目
  companyName: z.string().min(1, '会社名は必須です').max(200, '会社名は200文字以内で入力してください'),
  postalCode: z.string().regex(/^\d{7}$/, '郵便番号は7桁の数字で入力してください'),
  address: z.string().min(1, '住所は必須です').max(500, '住所は500文字以内で入力してください'),
  phone: z.string().min(1, '電話番号は必須です').max(20, '電話番号は20文字以内で入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  
  // 任意項目
  additionalInfo: z.string().max(1000, 'その他情報は1000文字以内で入力してください').optional()
});

type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;
```

---

## 💻 フォーム実装例

### React Hook Form での実装

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function CompanyInfoPage() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CompanyInfoFormData>({
    resolver: zodResolver(companyInfoSchema)
  });

  const onSubmit = async (data: CompanyInfoFormData) => {
    // API呼び出し
    const response = await fetch('/api/company-info', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      toast.error(error.error.message);
      return;
    }
    
    toast.success('自社情報を更新しました');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">自社情報設定</h1>

      {/* 会社名 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          会社名 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('companyName')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        {errors.companyName && (
          <span className="text-red-500 text-sm">{errors.companyName.message}</span>
        )}
      </div>

      {/* 郵便番号 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          郵便番号 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('postalCode')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="1234567"
          maxLength={7}
        />
        {errors.postalCode && (
          <span className="text-red-500 text-sm">{errors.postalCode.message}</span>
        )}
      </div>

      {/* 住所 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          住所 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('address')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
        />
        {errors.address && (
          <span className="text-red-500 text-sm">{errors.address.message}</span>
        )}
      </div>

      {/* 電話番号 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          電話番号 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('phone')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="03-1234-5678"
        />
        {errors.phone && (
          <span className="text-red-500 text-sm">{errors.phone.message}</span>
        )}
      </div>

      {/* メールアドレス */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="info@example.com"
        />
        {errors.email && (
          <span className="text-red-500 text-sm">{errors.email.message}</span>
        )}
      </div>

      {/* その他情報 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          その他情報
        </label>
        <textarea
          {...register('additionalInfo')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={4}
          placeholder="その他の情報があれば入力してください"
        />
        {errors.additionalInfo && (
          <span className="text-red-500 text-sm">{errors.additionalInfo.message}</span>
        )}
      </div>

      {/* ボタン */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          更新
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
```

---

## 🎨 UI表示のポイント

### 必須マークの表示

必須項目には赤いアスタリスク（*）を表示してください：

```tsx
<label>
  会社名 <span className="text-red-500">*</span>
</label>
```

### エラーメッセージの表示

各フィールドの下に赤文字でエラーメッセージを表示：

```tsx
{errors.companyName && (
  <span className="text-red-500 text-sm">{errors.companyName.message}</span>
)}
```

---

## 📚 参照ドキュメント

詳細は以下の設計書を参照してください：

- **03_画面設計.md** - SC-14の仕様（535-542行目）

---

## ✅ チェックリスト

実装時に以下を確認してください：

- [ ] 郵便番号を必須に変更
- [ ] 住所を必須に変更
- [ ] 電話番号を必須に変更
- [ ] メールアドレスを必須に変更
- [ ] その他情報は任意のまま
- [ ] 必須項目にアスタリスク（*）を表示
- [ ] バリデーションエラーメッセージを表示

---

## 📝 バリデーションエラーメッセージ例

| 項目 | エラーメッセージ |
|------|----------------|
| 会社名 | 会社名は必須です |
| 郵便番号 | 郵便番号は7桁の数字で入力してください |
| 住所 | 住所は必須です |
| 電話番号 | 電話番号は必須です |
| メールアドレス | 正しいメールアドレスを入力してください |

---

**この変更により、自社情報設定時にほぼ全ての情報が必須になります。**
