# 阿東 Line Bot 系統 - 簡化部署指南

## 快速開始（僅需 3 步驟）

完成這 3 個步驟後，系統將完全自動化運作。總共只需約 **15 分鐘**。

---

## 步驟 1：推送程式碼到 GitHub

✅ **此步驟將自動完成**

Cursor 會自動推送完整的程式碼到您的 GitHub Repository。程式碼中不包含任何敏感資訊，可以安全地公開。

---

## 步驟 2：在 Zeabur 部署（約 5 分鐘）

### 2.1 建立 Zeabur 專案

1. 前往 [https://zeabur.com](https://zeabur.com)
2. 使用 GitHub 帳號登入
3. 點擊「Create New Project」
4. 專案名稱：`grandma-linebot`
5. 選擇區域：Hong Kong 或 Tokyo（延遲較低）

### 2.2 連接 GitHub Repository

1. 在專案中點擊「Create Service」
2. 選擇「Git」→「GitHub」
3. 授權 Zeabur 存取您的 GitHub（如果首次使用）
4. 選擇 `grandma_linebot` repository
5. 選擇分支：`main`
6. Zeabur 會自動偵測 `zeabur.yaml` 並開始部署

### 2.3 新增 PostgreSQL 服務

1. 在同一個專案中，點擊「Create Service」
2. 選擇「Marketplace」→「PostgreSQL」
3. 版本選擇：15 或最新版本
4. 點擊「Deploy」
5. 等待資料庫服務啟動（約 1-2 分鐘）

### 2.4 等待自動部署完成

Zeabur 會自動執行：

- ✅ 安裝依賴（pnpm install）
- ✅ 生成 Prisma Client
- ✅ 建置專案
- ✅ 啟動服務

部署進度可在各服務的「Logs」分頁查看。通常需要 3-5 分鐘。

### 2.5 複製服務 URL

部署完成後，記下兩個服務的 URL：

1. 點擊 `admin-dashboard` 服務 → 複製服務 URL
   - 範例：`https://admin-grandma-linebot-xxx.zeabur.app`
2. 點擊 `linebot-api` 服務 → 複製服務 URL
   - 範例：`https://linebot-api-xxx.zeabur.app`

---

## 步驟 3：在後台配置系統（約 10 分鐘）

### 3.1 首次登入後台

1. 開啟瀏覽器，前往步驟 2.5 複製的 `admin-dashboard` URL
2. 如果是首次部署，系統會顯示「配置精靈」
3. 選擇登入方式（建議先跳過，直接進入配置）

### 3.2 進入系統設定頁面

1. 進入後台後，點擊側邊欄的「⚙️ 系統設定」
2. 您會看到以下配置區塊需要填寫

### 3.3 填寫配置資訊

請依序填入以下資訊：

#### 📋 基本配置

**Line Bot 配置**：
- Channel Secret：`輸入您的 Line Channel Secret`
- Access Token：`輸入您的 Line Channel Access Token`
- 點擊「測試連接」確認配置正確
- 點擊「儲存」

**n8n 配置**：
- API URL：`輸入您的 n8n API URL`
  - 範例：`https://your-n8n-domain.zeabur.app/api/v1`
- API KEY：`輸入您的 n8n API KEY`
  - 可參考本地的 `n8n_secretdoc.md`（此檔案不會被推送到 GitHub）
- 點擊「測試連接」確認配置正確
- 點擊「儲存」

#### 🤖 AI 模型配置

**Gemini API KEYs**：
- 免費版 KEY：`輸入您的 Gemini 免費版 API KEY`
  - 適用模型：gemini-3-flash-preview, gemini-2.5-pro, gemini-2.5-flash
  - 可參考本地的 `gemini_API_KEY.md`（此檔案不會被推送到 GitHub）
- 付費版 KEY：`輸入您的 Gemini 付費版 API KEY`
  - 適用模型：gemini-3-pro-image-preview, gemini-2.5-flash-image, gemini-3-pro-preview
  - 可參考本地的 `gemini_API_KEY.md`
- 點擊「驗證 API KEY」確認兩個 KEY 都有效
- 點擊「儲存」

**模型選擇器**（使用預設值即可）：
- Line Bot 回覆：`gemini-2.5-flash`（免費，快速）
- AI 管家：`gemini-2.5-pro`（免費，分析能力強）
- 早安訊息：`gemini-2.5-flash`（免費，快速）

#### ☁️ Google Drive 配置（可選）

如果您希望將生成的圖片永久儲存在 Google Drive：

1. 啟用狀態：開啟切換開關
2. Service Account JSON：上傳您的 Service Account 金鑰檔案
   - 參考：[如何取得 Service Account](https://console.cloud.google.com/)
3. 資料夾 ID：輸入您的 Google Drive 資料夾 ID
4. 點擊「測試連接」
5. 點擊「儲存」

**如果不使用 Google Drive**：
- 保持啟用狀態為「關閉」
- 圖片將儲存在 Zeabur 的臨時儲存空間

#### 🔐 OAuth 配置

**Google OAuth**（用於後台登入）：
1. 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 建立 OAuth 2.0 用戶端 ID
3. 授權重新導向 URI：`您的後台 URL/api/auth/callback/google`
   - 範例：`https://admin-grandma-linebot-xxx.zeabur.app/api/auth/callback/google`
4. 複製 Client ID 和 Client Secret
5. 在後台填入並點擊「儲存」

**Line Login**（可選）：
- 如果也要支援 Line 登入後台，填入 Line Login Channel ID 和 Secret
- 否則可以跳過

#### 🔧 進階設定

**內部 API URLs**（系統自動偵測，通常不需修改）：
- LineBot API URL：步驟 2.5 複製的 `linebot-api` URL
- Admin API URL：步驟 2.5 複製的 `admin-dashboard` URL

### 3.4 部署 n8n 工作流程

1. 完成上述所有配置後，點擊側邊欄的「🔄 n8n 工作流程管理」
2. 您會看到三個待部署的工作流程：
   - 早安訊息排程
   - 用戶畫像定期分析
   - 對話品質分析
3. 點擊「🔄 重新部署所有工作流程」按鈕
4. 等待部署完成（約 30 秒）
5. 確認所有工作流程狀態顯示「✅ 啟用」

---

## 🎉 完成！系統開始運作

配置完成後，系統將自動開始運作：

- ✅ **Line Bot 自動回覆**：用戶傳訊息後，AI 會在 30 秒內回覆
- ✅ **每日早安訊息**：n8n 每天早上 6:00-9:00 自動生成早安訊息（進入待審核）
- ✅ **用戶畫像分析**：每天凌晨 2:00 自動分析並更新用戶畫像
- ✅ **AI 管家待命**：隨時可在後台與 AI 管家對話，了解用戶狀況
- ✅ **完整日誌監控**：所有系統活動都可在後台「📊 系統日誌」查看

---

## 日常使用

### 審核早安訊息

1. 登入後台
2. 進入「📝 訊息審核」頁面
3. 查看待審核的早安訊息
4. 可以編輯內容或更換圖片
5. 點擊「批准」後，系統會自動發送給對應用戶

### 上傳知識文檔

1. 進入「📚 文檔知識庫」頁面
2. 點擊「上傳文檔」
3. 選擇檔案（支援 TXT, PDF, DOCX）
4. 填寫標題、分類和標籤
5. 系統會自動向量化並整合到 RAG 知識庫
6. Line Bot 會在對話中自然引用這些內容

### 查看用戶狀況

1. 進入「👥 用戶管理」頁面
2. 查看所有用戶列表和 AI 提取的用戶畫像
3. 點擊用戶可查看完整對話記錄
4. 可調整該用戶的早安訊息時間設定

### 與 AI 管家對話

1. 進入「🤖 AI 管家」頁面
2. 直接與 AI 管家對話，例如：
   - "最近哪些用戶比較活躍？"
   - "用戶 A 最近的狀態如何？"
   - "本週對話主題有哪些？"
3. 可切換不同的 Gemini 模型（右上角下拉選單）

---

## 系統更新

### 自動更新流程

當 Cursor 完成程式碼更新後：

1. ✅ 自動推送到 GitHub
2. ✅ Zeabur 自動偵測並重新部署
3. ✅ 部署完成後服務自動重啟
4. ✅ 無需人工介入

---

## 故障排除

### 問題 1：Line Bot 不回覆

**檢查步驟**：
1. 後台「🏥 系統健康檢查」→ 查看 Line Bot API 狀態
2. 後台「📊 系統日誌」→ 篩選 ERROR 等級日誌
3. 確認 Line Webhook URL 已設定正確（見下方）

### 問題 2：無法登入後台

**檢查步驟**：
1. 確認 OAuth 配置已在「系統設定」中填寫
2. 確認 Callback URL 與 Google Cloud Console 中設定一致
3. 查看瀏覽器控制台是否有錯誤訊息

### 問題 3：早安訊息未生成

**檢查步驟**：
1. 後台「🔄 n8n 工作流程管理」→ 確認工作流程已啟用
2. 點擊「早安訊息排程」→「查看詳情」→ 查看執行記錄
3. 後台「📊 系統日誌」→ 搜尋「morning」關鍵字

### 問題 4：圖片生成失敗

**檢查步驟**：
1. 後台「⚙️ 系統設定」→ 確認 Gemini 付費版 KEY 已填寫
2. 點擊「驗證 API KEY」確認 KEY 有效
3. 後台「📊 系統日誌」→ 搜尋「image」關鍵字查看錯誤

### 問題 5：n8n 工作流程部署失敗

**檢查步驟**：
1. 確認 n8n API URL 和 API KEY 正確
2. 點擊「測試連接」確認 n8n 可連接
3. 查看部署歷史中的錯誤訊息

---

## 附錄：Line Webhook 設定

完成步驟 2 後，需要設定 Line Webhook URL（**約 2 分鐘**）：

1. 前往 [Line Developers Console](https://developers.line.biz/console/)
2. 選擇您的 Messaging API Channel
3. 進入「Messaging API」分頁
4. 在「Webhook settings」中：
   - Webhook URL：`您的 linebot-api URL/webhook/line`
     - 範例：`https://linebot-api-xxx.zeabur.app/webhook/line`
   - 開啟「Use webhook」
   - 點擊「Verify」測試連接
5. 確認顯示「Success」

---

## 附錄：如何取得 API 金鑰

### Google Gemini API KEY

1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 點擊「Get API Key」或「Create API Key」
3. 選擇或建立專案
4. 複製 API Key
5. 在後台「系統設定」頁面填入

**需要兩個 KEY**：
- 免費版：用於對話、分析等功能
- 付費版：用於圖片生成功能

### n8n API KEY

1. 登入您已部署的 n8n 平台
2. 點擊右上角頭像 → 「Settings」
3. 前往「API」分頁
4. 點擊「Create API Key」
5. 複製生成的 API Key
6. 在後台「系統設定」頁面填入

### Google Drive Service Account（可選）

如果要使用 Google Drive 永久儲存圖片：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇專案 → 「IAM 與管理」→「服務帳戶」
3. 「建立服務帳戶」
4. 名稱：`linebot-storage`，角色選擇「編輯者」
5. 建立後，點擊該服務帳戶 →「金鑰」→「新增金鑰」→「JSON」
6. 下載 JSON 檔案
7. 在後台「系統設定」→「Google Drive 配置」上傳此檔案
8. 在 Google Drive 中建立資料夾，分享給服務帳戶的 email
9. 複製資料夾 ID（URL 中 `/folders/` 後面的字串）
10. 在後台填入資料夾 ID

---

## 技術支援

如果遇到問題：

1. **優先查看後台日誌**：「📊 系統日誌」頁面包含詳細的錯誤資訊
2. **檢查健康狀態**：「🏥 系統健康檢查」頁面顯示所有服務狀態
3. **諮詢 AI 管家**：在「🤖 AI 管家」頁面詢問系統問題

---

## 安全提醒

⚠️ **重要**：

- 所有 API KEY 和密鑰都應在後台「系統設定」頁面輸入
- 請勿將真實的 API KEY 填入本地的 `.env` 檔案後推送到 GitHub
- 本地的 `n8n_secretdoc.md` 和 `gemini_API_KEY.md` 已被 `.gitignore` 忽略，不會被推送
- `.env.example` 只是範例，不包含真實密鑰

---

## 系統架構說明

想了解更多技術細節？請參考：

- [架構文檔](architecture.md)：系統整體架構
- [API 規格](api-spec.md)：所有 API 端點說明
- [n8n 工作流程](n8n-workflows.md)：自動化流程說明
- [資料庫設計](database-schema.md)：資料庫結構

---

## 總結

完成這 3 個簡單步驟後，您就擁有一個：

- ✅ 自動回覆的 Line Bot
- ✅ 每日自動發送早安訊息（需審核）
- ✅ 記得用戶資訊，像真人一樣對話
- ✅ 可上傳知識文檔，增強對話內容
- ✅ AI 管家幫您監控所有用戶
- ✅ 完整的後台監控系統

之後的更新和維護都是全自動的！🎉
