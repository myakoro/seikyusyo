# README - 詳細設計書

## 概要

このディレクトリには、**スマート受発注 mini**（請求書発行システム）の詳細設計書が含まれています。

## ドキュメント一覧

1. **[01_システム前提条件・構成.md](./01_システム前提条件・構成.md)**
   - 開発環境・デプロイ環境の前提条件
   - 技術スタック（Next.js、PostgreSQL、Render）
   - システムアーキテクチャ
   - ディレクトリ構成

2. **[02_データベース設計.md](./02_データベース設計.md)**
   - ER図
   - 全8テーブルの詳細定義
   - リレーション
   - インデックス戦略
   - データ整合性

3. **[03_画面設計.md](./03_画面設計.md)**
   - 全16画面の仕様
   - 画面遷移図
   - 表示項目・入力項目
   - バリデーション
   - ボタン・アクション

4. **[04_API設計.md](./04_API設計.md)**
   - 30+ RESTful APIエンドポイント
   - リクエスト・レスポンス仕様
   - 認証・認可
   - エラーレスポンス

5. **[05_ビジネスロジック設計.md](./05_ビジネスロジック設計.md)**
   - 金額計算ロジック（詳細な計算式とコード例）
   - 請求書番号採番ロジック（同時実行制御含む）
   - ステータス遷移ロジック
   - スナップショット保存
   - バリデーション

6. **[06_セキュリティ・PDF・エラーハンドリング.md](./06_セキュリティ・PDF・エラーハンドリング.md)**
   - 認証・認可（NextAuth.js）
   - パスワード管理（bcrypt）
   - CSRF・XSS・SQLインジェクション対策
   - PDF生成（React PDF）
   - エラーハンドリング・ログ出力

7. **[07_デプロイ設計・開発計画.md](./07_デプロイ設計・開発計画.md)**
   - Renderへのデプロイ設定
   - CI/CDパイプライン
   - 開発フェーズ分け（MVP → 機能拡張 → 高度な機能）
   - テスト計画
   - リリース計画
   - 運用・保守

## 技術スタック

### フロントエンド
- Next.js 14+ (App Router)
- TypeScript
- React 18+
- Tailwind CSS
- React Hook Form + Zod

### バックエンド
- Next.js API Routes
- TypeScript
- NextAuth.js v5
- Prisma ORM
- @react-pdf/renderer

### データベース
- PostgreSQL 15+

### デプロイ
- Render（Web Service + PostgreSQL）
- GitHub（自動デプロイ）

## 開発の進め方

### フェーズ1: MVP（4〜6週間）
- 基本機能の実装
- 請求書CRUD、金額計算、PDF出力
- 認証、マスタ管理

### フェーズ2: 機能拡張（2〜4週間）
- メール通知
- ダッシュボード
- 検索・フィルタ強化

### フェーズ3: 高度な機能（4〜6週間）
- 外部会計ソフト連携
- 電子帳簿保存法対応
- 複数税率対応

## 実装担当

- **フロントエンド**: Windsurf
- **バックエンド**: Anthropic（Claude）

## 次のステップ

1. GitHubリポジトリ作成
2. Renderアカウント作成
3. ローカル開発環境セットアップ
4. データベース構築（Prismaスキーマ作成）
5. 認証機能実装
6. コア機能実装

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Render Documentation](https://render.com/docs)
- [React PDF Documentation](https://react-pdf.org/)

---

**作成日**: 2024-12-08  
**バージョン**: 1.0
