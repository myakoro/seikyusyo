# 04. API設計

## 4.1 API概要

### 基本仕様

- **プロトコル**: HTTPS
- **形式**: RESTful API
- **データ形式**: JSON
- **認証**: セッションベース（NextAuth.js）
- **エラーレスポンス**: 統一フォーマット

### 共通ヘッダー

**リクエスト**
```
Content-Type: application/json
Cookie: next-auth.session-token=<session_token>
```

**レスポンス**
```
Content-Type: application/json
```

### 共通エラーレスポンス

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

**HTTPステータスコード**

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 500 | サーバーエラー |

---

## 4.2 認証API

### POST /api/auth/signin

**説明**: ログイン（NextAuth.js標準エンドポイント）

**リクエスト**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**レスポンス（成功）**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user",
    "role": "COMPANY"
  }
}
```

**レスポンス（エラー）**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "ユーザーIDまたはパスワードが正しくありません"
  }
}
```

---

### POST /api/auth/signout

**説明**: ログアウト（NextAuth.js標準エンドポイント）

**リクエスト**: なし

**レスポンス（成功）**
```json
{
  "success": true
}
```

---

## 4.3 請求書API

### GET /api/invoices

**説明**: 請求書一覧取得

**認証**: 必須（自社ユーザー）

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| status | string | - | ステータスフィルタ（DRAFT, PENDING_APPROVAL, REJECTED, APPROVED, PAID） |
| freelancerId | string | - | フリーランスIDフィルタ |
| creatorId | string | - | 作成者IDフィルタ |
| billingDateFrom | string | - | 請求締日From（YYYY-MM-DD） |
| billingDateTo | string | - | 請求締日To（YYYY-MM-DD） |
| paymentDueDateFrom | string | - | 支払予定日From（YYYY-MM-DD） |
| paymentDueDateTo | string | - | 支払予定日To（YYYY-MM-DD） |
| sortBy | string | - | ソート項目（invoiceNumber, billingDate, paymentDueDate, invoiceAmount, createdAt） |
| sortOrder | string | - | ソート順（asc, desc） |
| page | number | - | ページ番号（デフォルト: 1） |
| limit | number | - | 1ページあたりの件数（デフォルト: 20） |

**レスポンス（成功）**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoiceNumber": "202411-0001",
      "freelancer": {
        "id": "uuid",
        "name": "山田太郎"
      },
      "creator": {
        "id": "uuid",
        "username": "admin"
      },
      "status": "APPROVED",
      "billingDate": "2024-11-30",
      "paymentDueDate": "2024-12-31",
      "paymentDate": null,
      "invoiceAmount": 108900,
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### GET /api/invoices/:id

**説明**: 請求書詳細取得

**認証**: 必須（自社ユーザー、該当フリーランス）

**レスポンス（成功）**
```json
{
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "202411-0001",
    "freelancerId": "uuid",
    "creatorId": "uuid",
    "status": "APPROVED",
    "billingDate": "2024-11-30",
    "paymentDueDate": "2024-12-31",
    "paymentDate": null,
    "notes": "備考テキスト",
    "companySnapshot": {
      "companyName": "株式会社サンプル",
      "address": "東京都...",
      "phone": "03-1234-5678"
    },
    "freelancerSnapshot": {
      "name": "山田太郎",
      "address": "神奈川県...",
      "phone": "090-1234-5678",
      "invoiceNumber": "T1234567890123"
    },
    "items": [
      {
        "id": "uuid",
        "lineNumber": 1,
        "productId": "uuid",
        "productName": "Webデザイン",
        "unitPrice": 100000,
        "quantity": 1,
        "commissionRate": 100.0,
        "taxType": "EXCLUSIVE",
        "taxRate": 10.0,
        "withholdingTaxTarget": true,
        "amount": 100000
      }
    ],
    "subtotal": 100000,
    "withholdingTaxSubtotal": 100000,
    "totalWithTax": 110000,
    "withholdingTax": 10210,
    "invoiceAmount": 99790,
    "statusHistory": [
      {
        "id": "uuid",
        "fromStatus": null,
        "toStatus": "DRAFT",
        "changedBy": {
          "id": "uuid",
          "username": "admin"
        },
        "comment": null,
        "createdAt": "2024-12-01T10:00:00Z"
      },
      {
        "id": "uuid",
        "fromStatus": "DRAFT",
        "toStatus": "PENDING_APPROVAL",
        "changedBy": {
          "id": "uuid",
          "username": "admin"
        },
        "comment": null,
        "createdAt": "2024-12-01T11:00:00Z"
      }
    ],
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T11:00:00Z",
    "confirmedAt": "2024-12-01T11:00:00Z"
  }
}
```

---

### POST /api/invoices

**説明**: 請求書作成

**認証**: 必須（自社ユーザー）

**リクエスト**
```json
{
  "freelancerId": "uuid",
  "billingDate": "2024-11-30",
  "paymentDueDate": "2024-12-31",
  "notes": "備考テキスト",
  "items": [
    {
      "productId": "uuid",
      "productName": "Webデザイン",
      "unitPrice": 100000,
      "quantity": 1,
      "commissionRate": 100.0,
      "taxType": "EXCLUSIVE",
      "taxRate": 10.0,
      "withholdingTaxTarget": true
    }
  ],
  "status": "DRAFT"
}
```

**レスポンス（成功）**
```json
{
  "invoice": {
    "id": "uuid",
    "invoiceNumber": null,
    "status": "DRAFT",
    "billingDate": "2024-11-30",
    "paymentDueDate": "2024-12-31",
    "invoiceAmount": 99790,
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

**バリデーションエラー例**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": {
      "items": "明細を1行以上入力してください",
      "paymentDueDate": "支払予定日は請求締日以降の日付を指定してください"
    }
  }
}
```

---

### PUT /api/invoices/:id

**説明**: 請求書更新

**認証**: 必須（自社ユーザー）

**制約**: 下書き、差し戻しのみ編集可能

**リクエスト**: POST /api/invoicesと同様

**レスポンス（成功）**: GET /api/invoices/:idと同様

**レスポンス（エラー）**
```json
{
  "error": {
    "code": "CANNOT_EDIT",
    "message": "承認済・支払済の請求書は編集できません"
  }
}
```

---

### POST /api/invoices/:id/confirm

**説明**: 請求書確定（下書き → 承認待ち）

**認証**: 必須（自社ユーザー）

**リクエスト**: なし

**レスポンス（成功）**
```json
{
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "202411-0001",
    "status": "PENDING_APPROVAL",
    "confirmedAt": "2024-12-01T11:00:00Z"
  },
  "notificationTemplate": "【請求書確定のお知らせ】\n\n山田太郎 様\n\nお世話になっております。\n請求書を作成いたしましたので、ご確認をお願いいたします。\n\n請求書番号: 202411-0001\n請求締日: 2024-11-30\n請求額: 99,790円\n\n以下のURLからログインしてご確認ください。\nhttps://smart-order-mini.onrender.com/login\n\n内容に問題がなければ「承認」を、修正が必要な場合は「差し戻し」をお願いいたします。\n\nよろしくお願いいたします。"
}
```

**処理フロー**
1. 請求書番号を採番（YYYYMM-XXXX形式）
2. 自社情報・フリーランス情報をスナップショット保存
3. ステータスを「PENDING_APPROVAL」に変更
4. InvoiceStatusHistoryに履歴追加
5. 連絡文テンプレート生成

---

### POST /api/invoices/:id/approve

**説明**: 請求書承認（承認待ち → 承認済）

**認証**: 必須（該当フリーランス）

**リクエスト**: なし

**レスポンス（成功）**
```json
{
  "invoice": {
    "id": "uuid",
    "status": "APPROVED"
  }
}
```

---

### POST /api/invoices/:id/reject

**説明**: 請求書差し戻し（承認待ち → 差し戻し）

**認証**: 必須（該当フリーランス）

**リクエスト**
```json
{
  "comment": "金額が異なります。ご確認ください。"
}
```

**レスポンス（成功）**
```json
{
  "invoice": {
    "id": "uuid",
    "status": "REJECTED"
  }
}
```

---

### POST /api/invoices/:id/mark-paid

**説明**: 支払済にする（承認済 → 支払済）

**認証**: 必須（自社ユーザー）

**リクエスト**
```json
{
  "paymentDate": "2024-12-25"
}
```

**レスポンス（成功）**
```json
{
  "invoice": {
    "id": "uuid",
    "status": "PAID",
    "paymentDate": "2024-12-25"
  }
}
```

---

### DELETE /api/invoices/:id

**説明**: 請求書削除

**認証**: 必須（自社ユーザー）

**制約**: 下書きのみ削除可能

**レスポンス（成功）**
```json
{
  "success": true
}
```

**レスポンス（エラー）**
```json
{
  "error": {
    "code": "CANNOT_DELETE",
    "message": "下書き以外の請求書は削除できません"
  }
}
```

---

### POST /api/invoices/:id/duplicate

**説明**: 請求書複製

**認証**: 必須（自社ユーザー）

**リクエスト**: なし

**レスポンス（成功）**
```json
{
  "invoice": {
    "id": "new-uuid",
    "status": "DRAFT",
    "billingDate": "2024-12-31",
    "paymentDueDate": "2025-01-31"
  }
}
```

**処理フロー**
1. 元の請求書の明細をコピー
2. 請求締日・支払予定日を再計算
3. ステータスを「DRAFT」に設定
4. 新規請求書として保存

---

## 4.4 フリーランスAPI

### GET /api/freelancers

**説明**: フリーランス一覧取得

**認証**: 必須（自社ユーザー）

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| name | string | - | 氏名フィルタ（部分一致） |
| email | string | - | メールアドレスフィルタ（部分一致） |
| status | string | - | ステータスフィルタ（ACTIVE, INACTIVE） |
| page | number | - | ページ番号（デフォルト: 1） |
| limit | number | - | 1ページあたりの件数（デフォルト: 20） |

**レスポンス（成功）**
```json
{
  "freelancers": [
    {
      "id": "uuid",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "phone": "090-1234-5678",
      "status": "ACTIVE",
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### GET /api/freelancers/:id

**説明**: フリーランス詳細取得

**認証**: 必須（自社ユーザー、フリーランス本人）

**レスポンス（成功）**
```json
{
  "freelancer": {
    "id": "uuid",
    "name": "山田太郎",
    "nameKana": "ヤマダタロウ",
    "postalCode": "1234567",
    "address": "神奈川県横浜市...",
    "phone": "090-1234-5678",
    "email": "yamada@example.com",
    "invoiceNumber": "T1234567890123",
    "bankName": "○○銀行",
    "bankBranch": "△△支店",
    "accountType": "ORDINARY",
    "accountNumber": "1234567",
    "accountHolder": "ヤマダタロウ",
    "withholdingTaxDefault": true,
    "status": "ACTIVE",
    "userId": "uuid",
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-01T10:00:00Z"
  }
}
```

---

### POST /api/freelancers

**説明**: フリーランス登録

**認証**: 必須（自社ユーザー）

**リクエスト**
```json
{
  "name": "山田太郎",
  "nameKana": "ヤマダタロウ",
  "email": "yamada@example.com",
  "postalCode": "1234567",
  "address": "神奈川県横浜市...",
  "phone": "090-1234-5678",
  "invoiceNumber": "T1234567890123",
  "bankName": "○○銀行",
  "bankBranch": "△△支店",
  "accountType": "ORDINARY",
  "accountNumber": "1234567",
  "accountHolder": "ヤマダタロウ",
  "withholdingTaxDefault": true,
  "status": "ACTIVE"
}
```

**レスポンス（成功）**
```json
{
  "freelancer": {
    "id": "uuid",
    "name": "山田太郎",
    "email": "yamada@example.com",
    "status": "ACTIVE",
    "createdAt": "2024-11-01T10:00:00Z"
  },
  "invitation": {
    "url": "https://smart-order-mini.onrender.com/login?token=abc123",
    "username": "yamada",
    "temporaryPassword": "TempPass123!"
  },
  "notificationTemplate": "【システム招待のご案内】\n\n山田太郎 様\n\nお世話になっております。\n請求書管理システムへのアクセス情報をお送りいたします。\n\n以下のURLからログインし、パスワードを変更してください。\n招待URL: https://smart-order-mini.onrender.com/login?token=abc123\nユーザーID: yamada\n仮パスワード: TempPass123!\n\nログイン後、ご自身の詳細情報（住所、振込先等）を編集・補完してください。\n\nよろしくお願いいたします。"
}
```

**処理フロー**
1. フリーランス情報をDBに保存
2. ユーザーアカウント作成（role: FREELANCER, status: PENDING）
3. 招待URL、ユーザーID、仮パスワードを生成
4. 連絡文テンプレート生成

---

### PUT /api/freelancers/:id

**説明**: フリーランス情報更新

**認証**: 必須（自社ユーザー、フリーランス本人）

**リクエスト**: POST /api/freelancersと同様

**レスポンス（成功）**: GET /api/freelancers/:idと同様

---

## 4.5 商品マスタAPI

### GET /api/products

**説明**: 商品マスタ一覧取得

**認証**: 必須（自社ユーザー）

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| freelancerId | string | - | フリーランスIDフィルタ |
| status | string | - | ステータスフィルタ（ACTIVE, INACTIVE） |

**レスポンス（成功）**
```json
{
  "products": [
    {
      "id": "uuid",
      "freelancerId": "uuid",
      "freelancerName": "山田太郎",
      "name": "Webデザイン",
      "unitPrice": 100000,
      "taxType": "EXCLUSIVE",
      "taxRate": 10.0,
      "withholdingTaxTarget": true,
      "status": "ACTIVE",
      "displayOrder": 1,
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ]
}
```

---

### GET /api/products/:id

**説明**: 商品マスタ詳細取得

**認証**: 必須（自社ユーザー）

**レスポンス（成功）**
```json
{
  "product": {
    "id": "uuid",
    "freelancerId": "uuid",
    "name": "Webデザイン",
    "unitPrice": 100000,
    "taxType": "EXCLUSIVE",
    "taxRate": 10.0,
    "withholdingTaxTarget": true,
    "status": "ACTIVE",
    "displayOrder": 1,
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-01T10:00:00Z"
  }
}
```

---

### POST /api/products

**説明**: 商品マスタ登録

**認証**: 必須（自社ユーザー）

**リクエスト**
```json
{
  "freelancerId": "uuid",
  "name": "Webデザイン",
  "unitPrice": 100000,
  "taxType": "EXCLUSIVE",
  "taxRate": 10.0,
  "withholdingTaxTarget": true,
  "status": "ACTIVE"
}
```

**レスポンス（成功）**
```json
{
  "product": {
    "id": "uuid",
    "name": "Webデザイン",
    "unitPrice": 100000,
    "status": "ACTIVE",
    "createdAt": "2024-11-01T10:00:00Z"
  }
}
```

---

### PUT /api/products/:id

**説明**: 商品マスタ更新

**認証**: 必須（自社ユーザー）

**リクエスト**: POST /api/productsと同様

**レスポンス（成功）**: GET /api/products/:idと同様

---

### DELETE /api/products/:id

**説明**: 商品マスタ削除

**認証**: 必須（自社ユーザー）

**レスポンス（成功）**
```json
{
  "success": true
}
```

---

### PUT /api/products/reorder

**説明**: 商品マスタ表示順序変更

**認証**: 必須（自社ユーザー）

**リクエスト**
```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"]
}
```

**レスポンス（成功）**
```json
{
  "success": true
}
```

---

## 4.6 自社情報API

### GET /api/company

**説明**: 自社情報取得

**認証**: 必須（自社ユーザー）

**レスポンス（成功）**
```json
{
  "company": {
    "id": "uuid",
    "companyName": "株式会社サンプル",
    "postalCode": "1234567",
    "address": "東京都...",
    "phone": "03-1234-5678",
    "email": "info@example.com",
    "additionalInfo": "その他情報",
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-01T10:00:00Z"
  }
}
```

---

### PUT /api/company

**説明**: 自社情報更新

**認証**: 必須（自社ユーザー）

**リクエスト**
```json
{
  "companyName": "株式会社サンプル",
  "postalCode": "1234567",
  "address": "東京都...",
  "phone": "03-1234-5678",
  "email": "info@example.com",
  "additionalInfo": "その他情報"
}
```

**レスポンス（成功）**: GET /api/companyと同様

---

## 4.7 ユーザー管理API

### GET /api/users

**説明**: ユーザー一覧取得

**認証**: 必須（自社ユーザー）

**レスポンス（成功）**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "role": "COMPANY",
      "status": "ACTIVE",
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ]
}
```

---

### POST /api/users

**説明**: ユーザー登録

**認証**: 必須（自社ユーザー）

**リクエスト**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "role": "COMPANY"
}
```

**レスポンス（成功）**
```json
{
  "user": {
    "id": "uuid",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "COMPANY",
    "status": "PENDING",
    "createdAt": "2024-11-01T10:00:00Z"
  },
  "invitation": {
    "url": "https://smart-order-mini.onrender.com/login?token=abc123",
    "username": "newuser",
    "temporaryPassword": "TempPass123!"
  }
}
```

---

### PUT /api/users/:id/deactivate

**説明**: ユーザー無効化

**認証**: 必須（自社ユーザー）

**レスポンス（成功）**
```json
{
  "user": {
    "id": "uuid",
    "status": "INACTIVE"
  }
}
```

---

## 4.8 PDF生成API

### GET /api/invoices/:id/pdf

**説明**: 請求書PDF生成・ダウンロード

**認証**: 必須（自社ユーザー、該当フリーランス）

**レスポンス（成功）**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice_202411-0001.pdf"

<PDF binary data>
```

**処理フロー**
1. 請求書データ取得（スナップショット含む）
2. PDFテンプレートに基づいてPDF生成
3. バイナリデータとしてレスポンス

---

## 4.9 統計API

### GET /api/dashboard/stats

**説明**: ダッシュボード統計情報取得

**認証**: 必須（自社ユーザー）

**レスポンス（成功）**
```json
{
  "stats": {
    "thisMonthInvoiceCount": {
      "draft": 5,
      "pendingApproval": 3,
      "rejected": 1,
      "approved": 10,
      "paid": 8
    },
    "thisMonthTotalAmount": 5000000,
    "unpaidCount": 13,
    "recentInvoices": [
      {
        "id": "uuid",
        "invoiceNumber": "202411-0001",
        "freelancerName": "山田太郎",
        "invoiceAmount": 99790,
        "status": "APPROVED",
        "createdAt": "2024-12-01T10:00:00Z"
      }
    ]
  }
}
```

---

## 次のドキュメント

- [05_ビジネスロジック設計.md](./05_ビジネスロジック設計.md)
