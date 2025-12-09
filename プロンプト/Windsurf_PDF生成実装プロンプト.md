# Windsurf UI実装 - PDF生成機能の実装

## 実装の背景

請求書のPDF出力機能を実装してください。`@react-pdf/renderer`を使用して、日本語対応のPDFを生成します。

---

## 📋 実装する機能

### PDF生成API

**エンドポイント**: `GET /api/invoices/:id/pdf`

**機能**: 請求書をPDF形式でダウンロード

---

## 🎨 PDFレイアウト

### 完成イメージ

```
┌─────────────────────────────────────┐
│ 請求書                               │
│                                     │
│ 請求書番号: 202411-0001              │
│ 請求日: 2024年11月30日               │
├─────────────────────────────────────┤
│ 【発注者】                           │
│ 株式会社サンプル                     │
│ 〒123-4567                          │
│ 東京都渋谷区...                      │
│ TEL: 03-1234-5678                   │
├─────────────────────────────────────┤
│ 【受注者】                           │
│ 山田太郎 様                          │
│ 〒123-4567                          │
│ 神奈川県横浜市...                    │
│ TEL: 090-1234-5678                  │
│ 適格請求書発行事業者登録番号:        │
│   T1234567890123                    │
├─────────────────────────────────────┤
│ 【振込先情報】                       │
│ 銀行名: ○○銀行                      │
│ 支店名: △△支店                      │
│ 口座種別: 普通                       │
│ 口座番号: 1234567                    │
│ 口座名義: ヤマダタロウ               │
├─────────────────────────────────────┤
│ 【明細】                             │
│ ┌──┬────┬──┬──┬────┬────┐ │
│ │品名│単価  │数│率│消費税│金額  │ │
│ ├──┼────┼──┼──┼────┼────┤ │
│ │Web│100,000│1│100│別10%│100,000│ │
│ └──┴────┴──┴──┴────┴────┘ │
├─────────────────────────────────────┤
│ 小計（税別）:           100,000円    │
│ 内、源泉税対象小計（税別）: 100,000円│
│ 合計（税込）:           110,000円    │
│ 源泉所得税:              10,210円    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 請求額（税込）:          99,790円    │
├─────────────────────────────────────┤
│ 【備考】                             │
│ よろしくお願いいたします。           │
└─────────────────────────────────────┘
```

---

## 💻 実装手順

### 1. パッケージのインストール

```bash
npm install @react-pdf/renderer
```

### 2. 日本語フォントの準備

**フォントファイルを配置**:

```
public/
  fonts/
    NotoSansJP-Regular.ttf
```

**ダウンロード元**: [Google Fonts - Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP)

---

### 3. PDFコンポーネントの作成

**ファイル**: `components/pdf/InvoicePDF.tsx`

```typescript
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// 日本語フォント登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf'
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    padding: 30
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 10,
    padding: 10,
    border: '1px solid #000'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  },
  tableCell: {
    border: '1px solid #000',
    padding: 5,
    fontSize: 9
  },
  total: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2px solid #000'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  }
});

interface Invoice {
  invoiceNumber: string;
  billingDate: Date;
  companySnapshot: {
    companyName: string;
    postalCode: string;
    address: string;
    phone: string;
  };
  freelancerSnapshot: {
    name: string;
    postalCode: string;
    address: string;
    phone: string;
    invoiceNumber?: string;
    bankName: string;
    bankBranch: string;
    accountType: 'ORDINARY' | 'CURRENT' | 'SAVINGS';
    accountNumber: string;
    accountHolder: string;
  };
  items: Array<{
    productName: string;
    unitPrice: number;
    quantity: number;
    commissionRate: number;
    taxType: 'INCLUSIVE' | 'EXCLUSIVE';
    taxRate: number;
    amount: number;
  }>;
  subtotal: number;
  withholdingTaxSubtotal: number;
  totalWithTax: number;
  withholdingTax: number;
  invoiceAmount: number;
  notes?: string;
}

const formatCurrency = (amount: number) => amount.toLocaleString('ja-JP');
const formatDate = (date: Date) => format(new Date(date), 'yyyy年MM月dd日');

const InvoicePDF: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* ヘッダー */}
      <Text style={styles.header}>請求書</Text>
      
      <View style={styles.section}>
        <Text>請求書番号: {invoice.invoiceNumber}</Text>
        <Text>請求日: {formatDate(invoice.billingDate)}</Text>
      </View>
      
      {/* 発注者情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>【発注者】</Text>
        <Text>{invoice.companySnapshot.companyName}</Text>
        <Text>〒{invoice.companySnapshot.postalCode}</Text>
        <Text>{invoice.companySnapshot.address}</Text>
        <Text>TEL: {invoice.companySnapshot.phone}</Text>
      </View>
      
      {/* 受注者情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>【受注者】</Text>
        <Text>{invoice.freelancerSnapshot.name} 様</Text>
        <Text>〒{invoice.freelancerSnapshot.postalCode}</Text>
        <Text>{invoice.freelancerSnapshot.address}</Text>
        <Text>TEL: {invoice.freelancerSnapshot.phone}</Text>
        {invoice.freelancerSnapshot.invoiceNumber && (
          <Text>適格請求書発行事業者登録番号: {invoice.freelancerSnapshot.invoiceNumber}</Text>
        )}
      </View>
      
      {/* 振込先情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>【振込先情報】</Text>
        <Text>銀行名: {invoice.freelancerSnapshot.bankName}</Text>
        <Text>支店名: {invoice.freelancerSnapshot.bankBranch}</Text>
        <Text>口座種別: {
          invoice.freelancerSnapshot.accountType === 'ORDINARY' ? '普通' :
          invoice.freelancerSnapshot.accountType === 'CURRENT' ? '当座' : '貯蓄'
        }</Text>
        <Text>口座番号: {invoice.freelancerSnapshot.accountNumber}</Text>
        <Text>口座名義: {invoice.freelancerSnapshot.accountHolder}</Text>
      </View>
      
      {/* 明細テーブル */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>【明細】</Text>
        <View style={styles.table}>
          {/* ヘッダー行 */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '30%' }]}>品名</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>単価</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>数量</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>率(%)</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>消費税</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>金額</Text>
          </View>
          
          {/* 明細行 */}
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '30%' }]}>{item.productName}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{item.commissionRate}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>
                {item.taxType === 'INCLUSIVE' ? '込' : '別'}{item.taxRate}%
              </Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* 集計 */}
      <View style={styles.section}>
        <View style={styles.summaryRow}>
          <Text>小計（税別）:</Text>
          <Text>{formatCurrency(invoice.subtotal)}円</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>内、源泉税対象小計（税別）:</Text>
          <Text>{formatCurrency(invoice.withholdingTaxSubtotal)}円</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>合計（税込）:</Text>
          <Text>{formatCurrency(invoice.totalWithTax)}円</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>源泉所得税:</Text>
          <Text>{formatCurrency(invoice.withholdingTax)}円</Text>
        </View>
        <Text style={styles.total}>請求額（税込）: {formatCurrency(invoice.invoiceAmount)}円</Text>
      </View>
      
      {/* 備考 */}
      {invoice.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>【備考】</Text>
          <Text>{invoice.notes}</Text>
        </View>
      )}
    </Page>
  </Document>
);

export default InvoicePDF;
```

---

### 4. PDF生成APIの作成

**ファイル**: `app/api/invoices/[id]/pdf/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import InvoicePDF from '@/components/pdf/InvoicePDF';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 請求書取得
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: true }
  });
  
  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  // アクセス権限チェック
  if (session.user.role === 'FREELANCER') {
    const freelancer = await prisma.freelancer.findFirst({
      where: { userId: session.user.id }
    });
    
    if (invoice.freelancerId !== freelancer?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  
  // スナップショットをパース
  const companySnapshot = JSON.parse(invoice.companySnapshot);
  const freelancerSnapshot = JSON.parse(invoice.freelancerSnapshot);
  
  // PDF生成
  const stream = await renderToStream(
    <InvoicePDF 
      invoice={{
        ...invoice,
        companySnapshot,
        freelancerSnapshot
      }} 
    />
  );
  
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice_${invoice.invoiceNumber}.pdf"`
    }
  });
}
```

---

### 5. フロントエンドからの呼び出し

**PDF出力ボタンの実装**:

```tsx
const handleDownloadPDF = async (invoiceId: string) => {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
    
    if (!response.ok) {
      toast.error('PDFの生成に失敗しました');
      return;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('PDFをダウンロードしました');
  } catch (error) {
    console.error('PDF download error:', error);
    toast.error('PDFのダウンロードに失敗しました');
  }
};

// ボタン
<button
  onClick={() => handleDownloadPDF(invoice.id)}
  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
>
  PDF出力
</button>
```

---

## 📚 参照ドキュメント

詳細は以下の設計書を参照してください：

- **06_セキュリティ・PDF・エラーハンドリング.md** - PDF生成設計（362-635行目）

---

## ✅ チェックリスト

実装時に以下を確認してください：

- [ ] `@react-pdf/renderer`をインストール
- [ ] 日本語フォント（Noto Sans JP）を配置
- [ ] PDFコンポーネント（`InvoicePDF.tsx`）を作成
- [ ] PDF生成API（`/api/invoices/:id/pdf`）を作成
- [ ] 振込先情報セクションを追加
- [ ] フロントエンドからPDFダウンロード機能を実装
- [ ] 請求書一覧・詳細画面にPDF出力ボタンを配置

---

**この実装により、請求書をPDF形式でダウンロードできるようになります。**
