# API 規格文件

## Base URLs

- **Line Bot API**: `https://linebot-api.zeabur.app`
- **Admin Dashboard**: `https://admin-dashboard.zeabur.app`

## Line Bot API

### Webhook Endpoints

#### POST /webhook/line

Line Messaging API Webhook 入口

**Headers**:
```
X-Line-Signature: <signature>
Content-Type: application/json
```

**Request Body**:
```json
{
  "events": [
    {
      "type": "message",
      "replyToken": "xxx",
      "source": {
        "userId": "Uxxxxx"
      },
      "message": {
        "type": "text",
        "text": "Hello"
      }
    }
  ]
}
```

**Response**: `200 OK`

---

### Cron Endpoints（供 n8n 呼叫）

#### GET /api/cron/check-morning-schedule

檢查哪些用戶需要發送早安訊息

**Response**:
```json
{
  "users": [
    {
      "userId": "Uxxxxx",
      "displayName": "王姐",
      "scheduledTime": "2026-01-21T07:15:00Z"
    }
  ]
}
```

#### GET /api/cron/active-users

取得活躍用戶列表

**Query Parameters**:
- `days` (optional): 最近幾天活躍，預設 7

**Response**:
```json
{
  "users": [
    {
      "userId": "Uxxxxx",
      "displayName": "王姐",
      "lastActiveAt": "2026-01-20T10:30:00Z"
    }
  ]
}
```

#### POST /api/cron/analyze-profile

分析用戶畫像

**Request Body**:
```json
{
  "userId": "Uxxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "profile": {
    "interests": ["爬山", "烹飪"],
    "family": "有一個女兒在國外",
    "health": "膝蓋不太好"
  }
}
```

---

### Messages Endpoints

#### POST /api/messages/pending

建立待審核訊息

**Request Body**:
```json
{
  "userId": "Uxxxxx",
  "messageType": "morning",
  "content": "早安，姐姐...",
  "imageUrl": "https://drive.google.com/uc?..."
}
```

**Response**:
```json
{
  "success": true,
  "messageId": 123
}
```

#### GET /api/messages/pending

取得待審核訊息列表

**Query Parameters**:
- `status` (optional): pending | approved | rejected | sent

**Response**:
```json
{
  "messages": [
    {
      "id": 123,
      "userId": "Uxxxxx",
      "content": "早安，姐姐...",
      "status": "pending",
      "createdAt": "2026-01-21T06:30:00Z"
    }
  ]
}
```

#### POST /api/messages/pending/:id/approve

批准訊息

**Request Body**:
```json
{
  "approvedBy": "admin@example.com"
}
```

#### POST /api/messages/send-approved

發送所有已批准的訊息

**Response**:
```json
{
  "success": true,
  "sentCount": 5
}
```

---

### Users Endpoints

#### GET /api/users

取得所有用戶

**Response**:
```json
{
  "users": [
    {
      "userId": "Uxxxxx",
      "displayName": "王姐",
      "firstContactAt": "2026-01-01T00:00:00Z",
      "lastActiveAt": "2026-01-20T10:30:00Z",
      "profileSummary": {}
    }
  ]
}
```

#### GET /api/users/:userId/conversations

取得用戶對話記錄

**Query Parameters**:
- `limit` (optional): 筆數限制，預設 50

**Response**:
```json
{
  "conversations": [
    {
      "id": 1,
      "role": "user",
      "content": "今天天氣真好",
      "timestamp": "2026-01-20T10:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "是啊姐姐，今天陽光普照...",
      "timestamp": "2026-01-20T10:00:05Z"
    }
  ]
}
```

---

### Documents Endpoints

#### POST /api/documents

新增文檔並自動向量化

**Request Body**:
```json
{
  "title": "子女孝順的重要性",
  "content": "文章內容...",
  "category": "孝順美德",
  "tags": ["孝順", "家庭", "價值觀"],
  "uploadedBy": "admin@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "document": {
    "id": 1,
    "title": "子女孝順的重要性",
    "isIndexed": true
  }
}
```

#### POST /api/documents/test-retrieval

測試 RAG 檢索

**Request Body**:
```json
{
  "query": "孝順父母",
  "topK": 5
}
```

**Response**:
```json
{
  "results": [
    {
      "id": 1,
      "title": "子女孝順的重要性",
      "content": "...",
      "category": "孝順美德",
      "referenceCount": 15
    }
  ]
}
```

---

## Admin Dashboard API

### AI Butler Chat

#### POST /api/ai-chat

與 AI 管家對話

**Headers**:
- `x-ai-model` (optional): 指定使用的模型

**Request Body**:
```json
{
  "message": "用戶 A 最近的狀態如何？",
  "conversationHistory": []
}
```

**Response**:
```json
{
  "response": "根據資料顯示，用戶 A...",
  "modelUsed": "gemini-2.5-pro"
}
```

---

## 錯誤回應格式

所有 API 錯誤使用統一格式：

```json
{
  "error": "錯誤類型",
  "message": "詳細錯誤訊息",
  "statusCode": 400
}
```

### 常見錯誤碼

- `400`: Bad Request - 請求參數錯誤
- `401`: Unauthorized - 未授權
- `404`: Not Found - 資源不存在
- `429`: Too Many Requests - 請求過於頻繁
- `500`: Internal Server Error - 伺服器內部錯誤

---

## Webhook 驗證

### Line Signature 驗證

Line Webhook 使用 HMAC-SHA256 簽名驗證：

```typescript
import crypto from 'crypto';

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}
```

已由 `@line/bot-sdk` middleware 自動處理。

---

## Rate Limiting（計畫實作）

建議的限制：

- Webhook: 無限制（由 Line 控制）
- Cron API: 每分鐘 60 次
- 其他 API: 每分鐘 100 次

---

## 版本管理

API 版本: `v1`

未來如有重大變更，將使用 `/api/v2/` 路徑。
