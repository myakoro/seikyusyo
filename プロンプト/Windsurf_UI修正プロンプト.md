# Windsurf UI実装 - 重要な仕様変更

## 変更の背景

詳細設計書の仕様が以下のように変更されました。既に実装を開始している場合は、この変更に対応してください。

---

## 🔴 重要な仕様変更

### 変更内容: 明細行の金額表示を税別に統一

**変更前**:
- 明細行の「金額」列は、消費税「込/別」の設定に応じて税込または税別が混在

**変更後**:
- 明細行の「金額」列は**常に税別金額を表示**
- 税込金額は集計セクションの「合計（税込）」でのみ表示

---

## 📋 修正が必要な箇所

### 1. 請求書作成画面（SC-05: `/invoices/new`）

#### 明細テーブルのカラム名変更

**変更前**:
```tsx
<th>金額</th>
```

**変更後**:
```tsx
<th>金額（税別）</th>
```

#### 明細行の金額表示

**重要**: 明細行の金額は**常に税別**で表示

```tsx
// 明細行の金額計算（常に税別）
const itemAmount = Math.round(unitPrice * quantity * (commissionRate / 100));

// 表示
<td>{itemAmount.toLocaleString()}円</td>
```

---

### 2. リアルタイム計算の実装

#### 計算タイミング

全ての入力フィールドで`onChange`イベント時にリアルタイム計算を実行してください。

**実装例**:

```tsx
// 状態管理
const [items, setItems] = useState<InvoiceItem[]>([]);
const [calculations, setCalculations] = useState({
  subtotal: 0,
  withholdingTaxSubtotal: 0,
  totalWithTax: 0,
  withholdingTax: 0,
  invoiceAmount: 0
});

// 明細が変更されたら即座に再計算
useEffect(() => {
  calculateTotals();
}, [items]);

// 単価入力時
<Input
  value={item.unitPrice}
  onChange={(e) => {
    updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0);
    // ↑ これだけで自動的に再計算される（useEffectが発火）
  }}
/>

// 消費税「込/別」変更時
<Select
  value={item.taxType}
  onChange={(e) => {
    updateItem(index, 'taxType', e.target.value);
    // ↑ 明細の金額は変わらないが、集計が再計算される
  }}
/>
```

#### 計算ロジック

```typescript
// 明細行の金額計算（常に税別）
function calculateItemAmount(
  unitPrice: number,
  quantity: number,
  commissionRate: number
): number {
  if (commissionRate === 0) {
    return unitPrice;
  }
  return Math.round(unitPrice * quantity * (commissionRate / 100));
}

// 集計計算
function calculateTotals(items: InvoiceItem[]) {
  // 1. 小計（税別）
  const subtotal = Math.round(
    items.reduce((sum, item) => {
      let taxExclusiveAmount: number;
      
      if (item.taxType === 'EXCLUSIVE') {
        // 税別: 金額をそのまま使用
        taxExclusiveAmount = item.amount;
      } else {
        // 税込: 税抜金額を逆算（四捨五入）
        taxExclusiveAmount = Math.round(item.amount / (1 + item.taxRate / 100));
      }
      
      return sum + taxExclusiveAmount;
    }, 0)
  );

  // 2. 源泉税対象小計（税別）
  const withholdingTaxSubtotal = Math.round(
    items
      .filter(item => item.withholdingTaxTarget)
      .reduce((sum, item) => {
        let taxExclusiveAmount: number;
        
        if (item.taxType === 'EXCLUSIVE') {
          taxExclusiveAmount = item.amount;
        } else {
          taxExclusiveAmount = Math.round(item.amount / (1 + item.taxRate / 100));
        }
        
        return sum + taxExclusiveAmount;
      }, 0)
  );

  // 3. 合計（税込）
  const totalWithTax = Math.round(
    items.reduce((sum, item) => {
      let taxInclusiveAmount: number;
      
      if (item.taxType === 'EXCLUSIVE') {
        // 税別: 税込金額を計算（四捨五入）
        taxInclusiveAmount = Math.round(item.amount * (1 + item.taxRate / 100));
      } else {
        // 税込: 金額をそのまま使用
        taxInclusiveAmount = item.amount;
      }
      
      return sum + taxInclusiveAmount;
    }, 0)
  );

  // 4. 源泉所得税（切り捨て）
  const withholdingTax = Math.floor(withholdingTaxSubtotal * 0.1021);

  // 5. 請求額（税込）
  const invoiceAmount = totalWithTax - withholdingTax;

  return {
    subtotal,
    withholdingTaxSubtotal,
    totalWithTax,
    withholdingTax,
    invoiceAmount
  };
}
```

---

### 3. 計算タイミング一覧表

| ユーザーの操作 | 明細の金額（税別） | 集計 | タイミング |
|-------------|----------------|------|----------|
| 単価を入力 | ✅ 再計算 | ✅ 再計算 | リアルタイム（onChange） |
| 個数を変更 | ✅ 再計算 | ✅ 再計算 | リアルタイム（onChange） |
| 報酬率を変更 | ✅ 再計算 | ✅ 再計算 | リアルタイム（onChange） |
| 消費税「込/別」変更 | ❌ 変わらない | ✅ 再計算 | リアルタイム（onChange） |
| 税率を変更 | ❌ 変わらない | ✅ 再計算 | リアルタイム（onChange） |
| 源泉税対象チェック | ❌ 変わらない | ✅ 再計算 | リアルタイム（onChange） |

**重要ポイント**:
- 明細の金額（税別）は、**単価・個数・報酬率の変更時のみ**再計算
- 消費税設定や税率を変更しても、**明細の金額（税別）は変わらない**
- 集計は**全ての入力変更時に再計算**

---

### 4. UI表示例

```
【明細テーブル】
┌──────────┬────────┬────┬────┬────┬────┬────┬──────────┐
│ 商品名    │ 単価    │個数│率  │消費│税率│源泉│金額（税別）│
├──────────┼────────┼────┼────┼────┼────┼────┼──────────┤
│Webデザイン│100,000  │ 1  │100%│別  │10% │ ○ │  100,000 │
│コーディング│ 50,000  │ 2  │100%│別  │10% │ ○ │  100,000 │
└──────────┴────────┴────┴────┴────┴────┴────┴──────────┘

【集計】
小計（税別）:              200,000円
内、源泉税対象小計（税別）:  200,000円
合計（税込）:              220,000円  ← ここで税込を表示
源泉所得税:                 20,420円
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
請求額（税込）:            199,580円
```

---

### 5. 請求書編集画面（SC-06）

SC-05と同様の変更を適用してください。

---

### 6. 請求書詳細画面（SC-07）

明細テーブルのカラム名を「金額（税別）」に変更してください。

---

## 📚 参照ドキュメント

詳細は以下の設計書を参照してください：

- **03_画面設計.md** - SC-05の仕様（211行目）
- **05_ビジネスロジック設計.md** - 計算ロジックの詳細（29-51行目）
- **02_データベース設計.md** - InvoiceItemテーブルの定義（242行目）

---

## ✅ チェックリスト

実装時に以下を確認してください：

- [ ] 明細テーブルのカラム名を「金額（税別）」に変更
- [ ] 明細行の金額は常に税別で表示
- [ ] 単価・個数・報酬率の変更時に明細の金額を再計算
- [ ] 消費税設定・税率の変更時は明細の金額を変更しない
- [ ] 全ての入力フィールドでonChangeイベントで集計を再計算
- [ ] 集計セクションの「合計（税込）」で税込金額を表示
- [ ] 小数点処理: Math.round()で四捨五入（源泉所得税のみMath.floor()）

---

## 💡 実装のヒント

### React Hook Formを使用している場合

```tsx
const { watch } = useForm();
const items = watch('items');

// itemsが変更されたら自動的に再計算
useEffect(() => {
  const totals = calculateTotals(items);
  setValue('subtotal', totals.subtotal);
  setValue('totalWithTax', totals.totalWithTax);
  // ...
}, [items]);
```

### パフォーマンス最適化

明細が多い場合でも、リアルタイム計算は十分高速です。ただし、以下の最適化を検討してください：

```tsx
// useMemoで計算結果をキャッシュ
const calculations = useMemo(() => {
  return calculateTotals(items);
}, [items]);
```

---

**この変更により、ユーザーは明細を入力しながらリアルタイムで請求額を確認でき、より使いやすいUIになります！**
