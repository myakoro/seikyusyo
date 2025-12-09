# Windsurf UI実装 - インボイス番号の表記変更

## 変更の背景

「インボイス番号」の表記を正式名称「適格請求書発行事業者登録番号」に変更しました。既に実装を開始している場合は、この変更に対応してください。

---

## 🔴 重要な仕様変更

### 変更内容: フィールド名の表記を正式名称に変更

**変更前**:
- インボイス番号

**変更後**:
- **適格請求書発行事業者登録番号**

---

## 📋 修正が必要な箇所

### 1. フリーランス登録画面（SC-09: `/freelancers/new`）

#### ラベル変更

```tsx
// 変更前
<label>インボイス番号</label>

// 変更後
<label>適格請求書発行事業者登録番号</label>
```

#### バリデーションメッセージ変更

```typescript
// 変更前
invoiceNumber: z.string().max(20, 'インボイス番号は20文字以内で入力してください').optional()

// 変更後
invoiceNumber: z.string().regex(/^T\d{13}$/, '適格請求書発行事業者登録番号は「T」 + 数字13桁で入力してください（例: T1234567890123）').optional().or(z.literal(''))
```

**ポイント**:
- 正規表現: `^T\d{13}$`
- 「T」（大文字） + 数字13桁
- 空文字列も許可（`.or(z.literal(''))`）

---

### 2. フリーランス編集画面（SC-10: `/freelancers/[id]/edit`）

SC-09と同様の変更を適用してください。

---

### 3. 請求書作成・編集画面（SC-05, SC-06）

#### お支払先情報の表示

```tsx
// 変更前
<div>
  <label>お支払先情報</label>
  <p>氏名、住所、電話番号、インボイス番号</p>
</div>

// 変更後
<div>
  <label>お支払先情報</label>
  <p>氏名、住所、電話番号、適格請求書発行事業者登録番号</p>
</div>
```

または、フィールドごとに表示する場合：

```tsx
// 変更前
<div>
  <span className="text-sm text-gray-600">インボイス番号:</span>
  <span>{freelancer.invoiceNumber || '未登録'}</span>
</div>

// 変更後
<div>
  <span className="text-sm text-gray-600">適格請求書発行事業者登録番号:</span>
  <span>{freelancer.invoiceNumber || '未登録'}</span>
</div>
```

---

### 4. 請求書詳細画面（SC-07: `/invoices/[id]`）

#### お支払先情報の表示

```tsx
// 変更後
<div className="space-y-2">
  <h3 className="font-semibold">お支払先情報</h3>
  <p>{invoice.freelancerSnapshot.name}</p>
  <p>{invoice.freelancerSnapshot.address}</p>
  <p>TEL: {invoice.freelancerSnapshot.phone}</p>
  {invoice.freelancerSnapshot.invoiceNumber && (
    <p>適格請求書発行事業者登録番号: {invoice.freelancerSnapshot.invoiceNumber}</p>
  )}
</div>
```

---

## 🎨 UI表示のポイント

### 長い項目名の対応

「適格請求書発行事業者登録番号」は長いため、以下の工夫を検討してください：

#### 1. 改行を入れる

```tsx
<label>
  適格請求書発行事業者<br />登録番号
</label>
```

#### 2. 小さめのフォントサイズ

```tsx
<label className="text-sm">
  適格請求書発行事業者登録番号
</label>
```

#### 3. 省略表示（任意）

フォーム内では正式名称、一覧表示では省略も可：

```tsx
// フォーム内
<label>適格請求書発行事業者登録番号</label>

// 一覧表示（スペースが限られる場合）
<th className="text-xs">登録番号</th>
```

---

## 📚 参照ドキュメント

詳細は以下の設計書を参照してください：

- **03_画面設計.md** - SC-05, SC-07, SC-09の仕様
- **02_データベース設計.md** - Freelancerテーブルの定義

---

## ✅ チェックリスト

実装時に以下を確認してください：

- [ ] フリーランス登録画面のラベルを変更
- [ ] フリーランス編集画面のラベルを変更
- [ ] 請求書作成画面の表示を変更
- [ ] 請求書編集画面の表示を変更
- [ ] 請求書詳細画面の表示を変更
- [ ] バリデーションエラーメッセージを変更
- [ ] 長い項目名に対応したUI調整

---

## 📝 実装例（完全版）

### フリーランス登録フォーム

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
    maxLength={20}
  />
  {errors.invoiceNumber && (
    <span className="text-red-500 text-sm">
      {errors.invoiceNumber.message}
    </span>
  )}
  <p className="text-xs text-gray-500 mt-1">
    任意項目です。登録している場合のみ入力してください。
  </p>
</div>
```

### 請求書詳細画面

```tsx
<div className="bg-gray-50 p-4 rounded-lg">
  <h3 className="font-semibold text-lg mb-3">お支払先情報</h3>
  <dl className="space-y-2">
    <div>
      <dt className="text-sm text-gray-600">氏名</dt>
      <dd className="font-medium">{invoice.freelancerSnapshot.name}</dd>
    </div>
    <div>
      <dt className="text-sm text-gray-600">住所</dt>
      <dd>{invoice.freelancerSnapshot.address}</dd>
    </div>
    <div>
      <dt className="text-sm text-gray-600">電話番号</dt>
      <dd>{invoice.freelancerSnapshot.phone}</dd>
    </div>
    {invoice.freelancerSnapshot.invoiceNumber && (
      <div>
        <dt className="text-sm text-gray-600">適格請求書発行事業者登録番号</dt>
        <dd className="font-mono text-sm">{invoice.freelancerSnapshot.invoiceNumber}</dd>
      </div>
    )}
  </dl>
</div>
```

---

**この変更により、正式名称「適格請求書発行事業者登録番号」が全画面で統一されます。**
