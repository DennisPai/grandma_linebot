# 系統架構文件

## 系統概述

阿東 Line Bot 是一個由 AI 和自動化驅動的智能對話系統，包含 Line Bot 核心服務、後台管理系統和自動化工作流程。

## 技術棧

### 後端
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **語言**: TypeScript
- **資料庫**: PostgreSQL 15
- **向量資料庫**: ChromaDB（嵌入式）
- **ORM**: Prisma

### 前端
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **樣式**: Tailwind CSS
- **認證**: NextAuth.js

### AI 服務
- **對話生成**: Google Gemini 2.5 Flash
- **進階分析**: Google Gemini 2.5 Pro
- **圖片生成**: Gemini 3 Pro Image + Gemini 2.5 Flash Image
- **向量化**: Gemini text-embedding-004

### 自動化
- **工作流程**: n8n
- **定時任務**: n8n Cron Trigger

### 儲存
- **圖片儲存**: Google Drive
- **對話記錄**: PostgreSQL
- **向量索引**: ChromaDB

### 部署
- **平台**: Zeabur
- **CI/CD**: GitHub Actions
- **容器**: 基於 Node.js

## 系統架構圖

詳見計畫文件中的 Mermaid 圖表。

## 資料流

### 1. 用戶訊息處理流程

```
用戶發送訊息
  ↓
Line API 接收
  ↓
Webhook → linebot-api
  ↓
儲存訊息到 PostgreSQL
  ↓
載入對話歷史（最近 10 條）
  ↓
載入用戶畫像
  ↓
RAG 檢索相關知識（ChromaDB）
  ↓
建構 Prompt（角色設定 + 用戶資訊 + 歷史 + 知識）
  ↓
Gemini 2.5 Flash 生成回覆
  ↓
儲存回覆到 PostgreSQL
  ↓
判斷回覆時間（< 25秒？）
  ├─ 是 → Reply Token
  └─ 否 → Push API
  ↓
觸發用戶畫像分析（非同步）
```

### 2. 早安訊息流程

```
n8n Cron 觸發（每天 06:00-09:00，每 5 分鐘）
  ↓
檢查需要發送的用戶
  ↓
為每個用戶生成早安內容
  ├─ 載入用戶畫像
  ├─ 載入最近對話
  ├─ Gemini 生成個性化內容
  └─ 決定是否需要圖片
      ├─ 需要場景圖 → Banana Pro 生成寫實照片
      └─ 一般問候 → 生成長輩圖
          ├─ 階段 1：Gemini 2.5 Flash Image 生成底圖
          ├─ 階段 2：Gemini 2.5 Flash 視覺分析
          └─ 階段 3：Canvas 渲染文字
  ↓
建立 PendingMessage（status: pending）
  ↓
管理員在後台審核
  ↓
批准後設定為 approved
  ↓
n8n 定時檢查 approved 訊息
  ↓
Push API 發送給用戶
  ↓
更新狀態為 sent
  ↓
更新下次發送時間（隨機在時間窗口內）
```

### 3. RAG 知識增強流程

```
管理員上傳文檔
  ↓
儲存到 PostgreSQL
  ↓
Gemini Embedding 生成向量
  ↓
儲存到 ChromaDB
  ↓
標記為已索引

--- 使用時 ---

用戶訊息 → 生成查詢向量
  ↓
ChromaDB 相似度搜尋
  ↓
根據用戶興趣重排
  ↓
返回前 3 名相關文檔
  ↓
融入 AI Prompt
  ↓
更新文檔引用次數
```

## API 端點

### Line Bot API (:3000)

#### Webhook
- `POST /webhook/line` - Line Webhook 入口（需 Line Signature 驗證）

#### Cron（供 n8n 呼叫）
- `GET /api/cron/check-morning-schedule` - 檢查早安排程
- `GET /api/cron/active-users` - 取得活躍用戶
- `POST /api/cron/analyze-profile` - 分析用戶畫像
- `GET /api/cron/conversation-quality` - 對話品質統計

#### 訊息管理
- `POST /api/messages/pending` - 建立待審核訊息
- `GET /api/messages/pending` - 取得待審核列表
- `POST /api/messages/pending/:id/approve` - 批准訊息
- `POST /api/messages/pending/:id/reject` - 拒絕訊息
- `POST /api/messages/send-approved` - 發送已批准訊息

#### 用戶管理
- `GET /api/users` - 取得所有用戶
- `GET /api/users/active` - 取得活躍用戶
- `GET /api/users/:userId` - 取得特定用戶
- `GET /api/users/:userId/conversations` - 取得對話記錄
- `GET /api/users/:userId/stats` - 取得用戶統計

#### 文檔管理
- `POST /api/documents` - 新增文檔並自動向量化
- `GET /api/documents` - 取得所有文檔
- `DELETE /api/documents/:id` - 刪除文檔
- `POST /api/documents/test-retrieval` - 測試 RAG 檢索

### Admin Dashboard API (:3001)

#### 認證
- `GET/POST /api/auth/[...nextauth]` - NextAuth 處理

#### 待實作（Phase 5-6）
- AI 管家對話 API
- 系統配置 API
- 即時監控 API

## 安全性設計

### 1. API 認證
- Line Webhook：Line Signature 驗證
- 後台 API：NextAuth OAuth
- n8n 回調：API Key 驗證（計畫實作）

### 2. 資料保護
- 敏感資訊存環境變數
- PostgreSQL 資料加密
- OAuth Token 安全儲存

### 3. Rate Limiting
- 計畫實作 API 請求限制
- 防止 API 濫用

## 擴展性考量

### 水平擴展
- 無狀態設計，支援多實例部署
- 資料庫連接池管理
- ChromaDB 可遷移到獨立服務

### 垂直擴展
- 快取系統減少資料庫查詢
- 非同步任務處理（用戶畫像分析）
- 圖片生成可改用佇列系統

## 監控與日誌

### 日誌級別
- DEBUG：開發階段詳細資訊
- INFO：一般操作記錄
- WARN：警告（非致命錯誤）
- ERROR：嚴重錯誤

### 關鍵指標
- API 回應時間
- Gemini API 使用量
- 對話成功率
- 圖片生成成功率
- 資料庫查詢效能

所有指標可在 Zeabur Dashboard 和後台管理系統中查看。
