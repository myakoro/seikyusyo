# Windsurf UI実装 - フリーランス登録画面の必須項目変更

## 変更の背景

フリーランス登録画面の必須項目が変更されました。既に実装を開始している場合は、この変更に対応してください。

---

## 🔴 重要な仕様変更

### 変更内容: ほぼ全ての項目を必須に変更

**任意項目（必須ではない）**:
- 氏名カナ
- 適格請求書発行事業者登録番号

**必須項目（○）**:
- 氏名
- メールアドレス
- **郵便番号** ← 変更
- **住所** ← 変更
- **電話番号** ← 変更
- **銀行名** ← 変更
- **支店名** ← 変更
- **口座種別** ← 変更
- **口座番号** ← 変更
- **口座名義** ← 変更
- ステータス

---

## 📋 修正が必要な箇所

### SC-09: フリーランス登録画面 (`/freelancers/new`)

#### バリデーションスキーマの更新

**Zodスキーマ例**:

```typescript
import { z } from 'zod';

const freelancerSchema = z.object({
  // 必須項目
  name: z.string().min(1, '氏名は必須です').max(200, '氏名は200文字以内で入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  postalCode: z.string().regex(/^\d{7}$/, '郵便番号は7桁の数字で入力してください'),
  address: z.string().min(1, '住所は必須です').max(500, '住所は500文字以内で入力してください'),
  phone: z.string().min(1, '電話番号は必須です').max(20, '電話番号は20文字以内で入力してください'),
  bankName: z.string().min(1, '銀行名は必須です').max(100, '銀行名は100文字以内で入力してください'),
  bankBranch: z.string().min(1, '支店名は必須です').max(100, '支店名は100文字以内で入力してください'),
  accountType: z.enum(['ORDINARY', 'CURRENT', 'SAVINGS'], {
    errorMap: () => ({ message: '口座種別を選択してください' })
  }),
  accountNumber: z.string().min(1, '口座番号は必須です').max(20, '口座番号は20文字以内で入力してください'),
  accountHolder: z.string().min(1, '口座名義は必須です').max(200, '口座名義は200文字以内で入力してください'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  
  // 任意項目
  nameKana: z.string().max(200, '氏名カナは200文字以内で入力してください').optional(),
  invoiceNumber: z.string().regex(/^T\d{13}$/, '適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください（例: T1234567890123）').optional().or(z.literal('')),
  
  // その他
  withholdingTaxDefault: z.boolean().default(true)
});

type FreelancerFormData = z.infer<typeof freelancerSchema>;
```

---

## 💻 フォーム実装例

### React Hook Form での実装

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function FreelancerNewPage() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FreelancerFormData>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: {
      status: 'ACTIVE',
      withholdingTaxDefault: true
    }
  });

  const onSubmit = async (data: FreelancerFormData) => {
    // API呼び出し
    const response = await fetch('/api/freelancers', {
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
    // 招待文テンプレート表示など
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 基本情報 */}
      <div>
        <label>氏名 <span className="text-red-500">*</span></label>
        <input {...register('name')} />
        {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      </div>

      <div>
        <label>氏名カナ</label>
        <input {...register('nameKana')} />
        {errors.nameKana && <span className="text-red-500">{errors.nameKana.message}</span>}
      </div>

      <div>
        <label>メールアドレス <span className="text-red-500">*</span></label>
        <input {...register('email')} type="email" />
        {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      </div>

      <div>
        <label>郵便番号 <span className="text-red-500">*</span></label>
        <input {...register('postalCode')} placeholder="1234567" />
        {errors.postalCode && <span className="text-red-500">{errors.postalCode.message}</span>}
      </div>

      <div>
        <label>住所 <span className="text-red-500">*</span></label>
        <textarea {...register('address')} />
        {errors.address && <span className="text-red-500">{errors.address.message}</span>}
      </div>

      <div>
        <label>電話番号 <span className="text-red-500">*</span></label>
        <input {...register('phone')} />
        {errors.phone && <span className="text-red-500">{errors.phone.message}</span>}
      </div>

      <div>
        <label>適格請求書発行事業者登録番号</label>
        <input {...register('invoiceNumber')} />
        {errors.invoiceNumber && <span className="text-red-500">{errors.invoiceNumber.message}</span>}
      </div>

      {/* 振込先情報 */}
      <div>
        <label>銀行名 <span className="text-red-500">*</span></label>
        <input {...register('bankName')} />
        {errors.bankName && <span className="text-red-500">{errors.bankName.message}</span>}
      </div>

      <div>
        <label>支店名 <span className="text-red-500">*</span></label>
        <input {...register('bankBranch')} />
        {errors.bankBranch && <span className="text-red-500">{errors.bankBranch.message}</span>}
      </div>

      <div>
        <label>口座種別 <span className="text-red-500">*</span></label>
        <select {...register('accountType')}>
          <option value="">選択してください</option>
          <option value="ORDINARY">普通</option>
          <option value="CURRENT">当座</option>
          <option value="SAVINGS">貯蓄</option>
        </select>
        {errors.accountType && <span className="text-red-500">{errors.accountType.message}</span>}
      </div>

      <div>
        <label>口座番号 <span className="text-red-500">*</span></label>
        <input {...register('accountNumber')} />
        {errors.accountNumber && <span className="text-red-500">{errors.accountNumber.message}</span>}
      </div>

      <div>
        <label>口座名義 <span className="text-red-500">*</span></label>
        <input {...register('accountHolder')} />
        {errors.accountHolder && <span className="text-red-500">{errors.accountHolder.message}</span>}
      </div>

      <button type="submit">登録</button>
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
  銀行名 <span className="text-red-500">*</span>
</label>
```

### エラーメッセージの表示

各フィールドの下に赤文字でエラーメッセージを表示：

```tsx
{errors.bankName && (
  <span className="text-red-500 text-sm">{errors.bankName.message}</span>
)}
```

---

## 📚 参照ドキュメント

詳細は以下の設計書を参照してください：

- **03_画面設計.md** - SC-09の仕様（373-388行目）

---

## ✅ チェックリスト

実装時に以下を確認してください：

- [ ] 郵便番号を必須に変更
- [ ] 住所を必須に変更
- [ ] 電話番号を必須に変更
- [ ] 銀行名を必須に変更
- [ ] 支店名を必須に変更
- [ ] 口座種別を必須に変更
- [ ] 口座番号を必須に変更
- [ ] 口座名義を必須に変更
- [ ] 氏名カナは任意のまま
- [ ] 適格請求書発行事業者登録番号は任意のまま
- [ ] 必須項目にアスタリスク（*）を表示
- [ ] バリデーションエラーメッセージを表示

---

## 📝 バリデーションエラーメッセージ例

| 項目 | エラーメッセージ |
|------|----------------|
| 郵便番号 | 郵便番号は7桁の数字で入力してください |
| 住所 | 住所は必須です |
| 電話番号 | 電話番号は必須です |
| 銀行名 | 銀行名は必須です |
| 支店名 | 支店名は必須です |
| 口座種別 | 口座種別を選択してください |
| 口座番号 | 口座番号は必須です |
| 口座名義 | 口座名義は必須です |

---

**この変更により、フリーランス登録時に振込先情報を含むほぼ全ての情報が必須になります。**
