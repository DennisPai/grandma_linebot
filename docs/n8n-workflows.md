# n8n 工作流程說明

## 概述

本專案使用 n8n 進行自動化任務編排，所有工作流程通過 API 自動部署。

## 工作流程列表

### 1. 早安訊息排程

**檔案**: `apps/n8n-workflows/workflows/morning-greeting.json`

**觸發頻率**: 每天 06:00-09:00，每 5 分鐘執行一次

**流程**:

1. **Schedule Trigger** - Cron 觸發器
   - Cron 表達式：`*/5 6-9 * * *`
   
2. **Check Users Need Greeting** - HTTP Request
   - 呼叫：`GET /api/cron/check-morning-schedule`
   - 返回：需要發送早安的用戶列表

3. **Loop Users** - Split In Batches
   - 逐一處理每個用戶

4. **Generate Morning Message** - HTTP Request
   - 呼叫：`POST /api/messages/generate-morning`
   - 為用戶生成個性化早安內容

5. **Create Pending Approval** - HTTP Request
   - 呼叫：`POST /api/messages/pending`
   - 建立待審核訊息記錄

**產出**: 每天自動為用戶生成早安訊息，進入待審核佇列

---

### 2. 用戶畫像定期分析

**檔案**: `apps/n8n-workflows/workflows/user-profiling.json`

**觸發頻率**: 每天凌晨 02:00

**流程**:

1. **Daily Trigger** - Cron 觸發器
   - Cron 表達式：`0 2 * * *`

2. **Get All Active Users** - HTTP Request
   - 呼叫：`GET /api/cron/active-users`
   - 返回：最近 7 天活躍的用戶

3. **Loop Users** - Split In Batches
   - 逐一處理每個用戶

4. **Analyze User Profile** - HTTP Request
   - 呼叫：`POST /api/cron/analyze-profile`
   - 使用 AI 分析對話並更新用戶畫像

**產出**: 每日更新所有活躍用戶的畫像資訊

---

### 3. 對話品質分析

**檔案**: `apps/n8n-workflows/workflows/conversation-analysis.json`

**觸發頻率**: 每天凌晨 03:00

**流程**:

1. **Daily Trigger** - Cron 觸發器
   - Cron 表達式：`0 3 * * *`

2. **Analyze Conversation Quality** - HTTP Request
   - 呼叫：`GET /api/cron/conversation-quality`
   - 生成對話品質統計報告

**產出**: 每日對話品質報告（可擴展為發送到 Slack/Email）

---

## 部署方式

### 自動部署

在專案根目錄執行：

```bash
pnpm --filter n8n-workflows deploy
```

腳本會：
1. 讀取所有 workflow JSON 檔案
2. 檢查 n8n 中是否已存在同名工作流程
3. 存在則更新，不存在則建立
4. 自動啟用工作流程

### 環境變數需求

部署腳本需要以下環境變數：

```env
N8N_API_URL=https://your-n8n-domain.zeabur.app/api/v1
N8N_API_KEY=your_n8n_api_key_here
LINEBOT_API_URL=https://your-linebot-api-domain.zeabur.app
```

**注意**：這些環境變數將從後台系統配置自動載入，無需手動設定。

---

## 工作流程監控

### 在 n8n 介面中查看

1. 登入您的 n8n 平台（URL 可在後台系統設定中查看）
2. 進入「Workflows」
3. 點擊工作流程名稱查看詳情
4. 查看「Executions」分頁瞭解執行歷史

### 執行記錄

每次執行都會記錄：
- 執行時間
- 執行狀態（成功/失敗）
- 輸入/輸出資料
- 錯誤訊息（如果失敗）

---

## 故障排除

### 工作流程未執行

**可能原因**:
1. 工作流程未啟用（Active = false）
2. Cron 表達式錯誤
3. n8n 服務未運行

**解決方法**:
1. 檢查工作流程狀態，確認 Active 開關已開啟
2. 驗證 Cron 表達式：https://crontab.guru/
3. 檢查 n8n 服務狀態

### HTTP Request 失敗

**可能原因**:
1. LINEBOT_API_URL 設定錯誤
2. API 端點不存在或返回錯誤
3. 網路連接問題

**解決方法**:
1. 在 n8n 的工作流程設定中確認 `{{$env.LINEBOT_API_URL}}` 正確
2. 手動測試 API 端點（使用 Postman 或 curl）
3. 查看 linebot-api 的 Logs

### 認證失敗

如果未來實作 API 認證：
1. 確認 HTTP Request node 的 Authentication 設定
2. 檢查 API Key 或 Token 是否正確

---

## 擴展建議

### 新增工作流程

1. 在 `apps/n8n-workflows/workflows/` 建立新的 JSON 檔案
2. 定義工作流程節點和連接
3. 更新 `deploy-workflows.ts` 中的 `workflows` 陣列
4. 執行部署腳本

### 常見的新增工作流程

- **發送統計報告**：每週寄送對話統計到 Email
- **異常偵測**：偵測異常對話模式並通知
- **定時清理**：清理舊的對話記錄或圖片
- **A/B 測試**：測試不同的對話策略

---

## Cron 表達式參考

| 表達式 | 說明 |
|--------|------|
| `*/5 6-9 * * *` | 每天 06:00-09:00，每 5 分鐘 |
| `0 2 * * *` | 每天凌晨 02:00 |
| `0 */6 * * *` | 每 6 小時 |
| `0 0 * * 0` | 每週日凌晨 00:00 |
| `0 0 1 * *` | 每月 1 號凌晨 00:00 |

工具：https://crontab.guru/

---

## 整合測試

### 手動觸發測試

1. 在 n8n 介面中
2. 開啟工作流程
3. 點擊右上角「Execute Workflow」
4. 查看執行結果

### 驗證資料流

1. 檢查 linebot-api Logs
2. 查看資料庫中的 PendingMessage 表
3. 確認後台可以看到待審核訊息

---

## API 呼叫範例

### 早安訊息生成 API

**請求**:
```http
POST /api/messages/generate-morning
Content-Type: application/json

{
  "userId": "Uxxxxx"
}
```

**預期回應**:
```json
{
  "message": "早安，姐姐...",
  "imageUrl": "https://drive.google.com/uc?...",
  "userId": "Uxxxxx"
}
```

### 批次發送已批准訊息

可新增 n8n 工作流程，每 10 分鐘呼叫一次：

```http
POST /api/messages/send-approved
```

這樣早安訊息被批准後，最多 10 分鐘內就會自動發送。
