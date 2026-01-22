# 系統配置完整指南

本文件詳細說明後台系統設定頁面中所有配置項目的用途和設定方式。

---

## 配置項目總覽

系統配置分為以下幾個區塊：

1. 📋 **基本配置**：Line Bot 和 n8n 設定
2. 🤖 **AI 模型配置**：Gemini API KEYs 和模型選擇
3. ☁️ **Google Drive 配置**：圖片永久儲存設定
4. 🔐 **OAuth 配置**：後台登入設定
5. 🔧 **進階設定**：內部 API URLs

---

## 1. 📋 基本配置

### Line Bot 配置

**用途**：讓系統能夠與 Line 平台通訊

**需要的資訊**：

#### Channel Secret
- **取得方式**：
  1. 前往 [Line Developers Console](https://developers.line.biz/console/)
  2. 選擇您的 Messaging API Channel
  3. 進入「Basic settings」分頁
  4. 找到「Channel secret」並複製
- **格式**：32 個字元的十六進位字串
- **範例**：`1234567890abcdef1234567890abcdef`

#### Access Token
- **取得方式**：
  1. 在同一個 Channel 中
  2. 進入「Messaging API」分頁
  3. 找到「Channel access token」
  4. 點擊「Issue」（如果尚未發行）
  5. 複製 Token
- **格式**：長字串，以 + 或 = 結尾
- **範例**：`AbCd123...xyz==`
- **注意**：Token 只會顯示一次，請妥善保存

**測試連接**：
- 點擊「測試連接」後，系統會呼叫 Line API 取得 Bot 資訊
- 如果成功，會顯示 Bot 的名稱和 ID

---

### n8n 配置

**用途**：讓後台能夠部署和管理 n8n 工作流程

**需要的資訊**：

#### API URL
- **格式**：`https://your-n8n-domain/api/v1`
- **範例**：`https://my-n8n.zeabur.app/api/v1`
- **注意**：URL 必須以 `/api/v1` 結尾

#### API KEY
- **取得方式**：
  1. 登入您的 n8n 平台
  2. 點擊右上角使用者圖示 → Settings
  3. 進入「API」分頁
  4. 點擊「Create API Key」
  5. 設定名稱（如 `linebot-system`）
  6. 複製生成的 API Key
- **格式**：JWT Token 格式
- **範例**：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **權限**：需要有完整的工作流程管理權限

**測試連接**：
- 系統會嘗試列出現有的工作流程
- 如果成功，會顯示目前的工作流程數量

---

## 2. 🤖 AI 模型配置

### Gemini API KEYs

系統使用兩個不同的 API KEY 來優化成本：

#### 免費版 KEY
- **用途**：
  - Line Bot 對話回覆（gemini-2.5-flash）
  - 早安訊息內容生成（gemini-2.5-flash）
  - AI 管家對話（gemini-2.5-pro）
  - 文檔向量化（text-embedding-004）
  - 長輩圖視覺分析（gemini-2.5-flash）
- **適用模型**：
  - `gemini-3-flash-preview`
  - `gemini-2.5-pro`
  - `gemini-2.5-flash`
- **成本**：免費無限制使用

#### 付費版 KEY
- **用途**：
  - 寫實照片生成（gemini-3-pro-image-preview）
  - 長輩圖底圖生成（gemini-2.5-flash-image）
  - 高級 AI 分析（gemini-3-pro-preview，選用）
- **適用模型**：
  - `gemini-3-pro-image-preview`（Banana Pro）
  - `gemini-2.5-flash-image`
  - `gemini-3-pro-preview`
- **成本**：依使用量計費

**取得方式**：
1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 點擊「Get API Key」或「Create API Key」
3. 選擇或建立專案（可以為免費版和付費版建立不同專案）
4. 複製 API Key
5. 在後台系統設定頁面分別填入兩個 KEY

**驗證 API KEY**：
- 點擊「驗證 API KEY」按鈕
- 系統會使用 gemini-2.5-flash 模型測試兩個 KEY
- 如果成功，會顯示「驗證成功」

---

### 模型選擇器

**用途**：為不同功能選擇最適合的 AI 模型

#### Line Bot 回覆模型
- **預設**：`gemini-2.5-flash`（免費，快速）
- **建議**：保持預設值，足以應付一般對話
- **替代選項**：
  - `gemini-2.5-pro`：更強的理解能力，但較慢
  - `gemini-3-flash-preview`：最新預覽版
  - `gemini-3-pro-preview`：最強能力，但需付費

#### AI 管家模型
- **預設**：`gemini-2.5-pro`（免費，分析能力強）
- **建議**：如需深度分析，可切換至 `gemini-3-pro-preview`（付費）
- **用途**：後台 AI 管家對話和數據分析

#### 早安訊息模型
- **預設**：`gemini-2.5-flash`（免費，快速）
- **建議**：保持預設值，生成速度快
- **用途**：生成每日早安訊息內容

**成本監控**：
- 在「系統設定」頁面下方會顯示各模型的使用統計
- 可查看最近 7 天或 30 天的使用量和成本

---

## 3. ☁️ Google Drive 配置

**用途**：永久儲存 Line Bot 生成的所有圖片

**為什麼需要**：
- Zeabur 的臨時儲存可能在重新部署時清空
- 免費 15GB 配額，足夠儲存數千張圖片
- 提供全球 CDN 加速
- 圖片資料獨立於應用服務，更安全

### 設定步驟

#### 步驟 1：啟用 Google Drive API

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立專案
3. 點擊「API 和服務」→「啟用 API 和服務」
4. 搜尋「Google Drive API」
5. 點擊「啟用」

#### 步驟 2：建立 Service Account

1. 在 Google Cloud Console 中
2. 點擊「IAM 與管理」→「服務帳戶」
3. 點擊「建立服務帳戶」
4. 服務帳戶詳細資料：
   - 名稱：`linebot-storage`
   - 描述：`Line Bot 圖片儲存服務帳戶`
5. 角色選擇：「編輯者」
6. 點擊「完成」

#### 步驟 3：建立並下載金鑰

1. 點擊剛建立的服務帳戶
2. 切換到「金鑰」分頁
3. 點擊「新增金鑰」→「建立新金鑰」
4. 金鑰類型選擇：**JSON**
5. 點擊「建立」
6. JSON 檔案會自動下載到您的電腦

#### 步驟 4：建立 Google Drive 資料夾

1. 開啟 [Google Drive](https://drive.google.com/)
2. 建立新資料夾，名稱：`grandma_linebot`
3. 對該資料夾點右鍵 → 「分享」
4. 在「新增使用者和群組」中，貼上服務帳戶的 email
   - Email 在步驟 3 下載的 JSON 中的 `client_email` 欄位
   - 範例：`linebot-storage@project-id.iam.gserviceaccount.com`
5. 權限設定為「編輯者」
6. 點擊「傳送」
7. 複製資料夾 ID（在瀏覽器 URL 中 `/folders/` 後面的字串）

#### 步驟 5：在後台填入配置

1. 啟用狀態：開啟切換開關
2. Service Account JSON：
   - 點擊「上傳檔案」
   - 選擇步驟 3 下載的 JSON 檔案
   - 或直接貼上 JSON 內容
3. 資料夾 ID：貼上步驟 4 複製的資料夾 ID
4. 點擊「測試連接」確認配置正確
5. 點擊「儲存」

**測試連接**：
- 系統會嘗試存取指定的資料夾
- 如果成功，會顯示資料夾名稱

**不使用 Google Drive 的影響**：
- 圖片會儲存在 Zeabur 的臨時空間
- 重新部署時圖片可能會遺失
- 建議至少在正式環境啟用

---

## 4. 🔐 OAuth 配置

**用途**：讓管理員可以登入後台系統

### Google OAuth

**設定步驟**：

1. 前往 [Google Cloud Console - 憑證](https://console.cloud.google.com/apis/credentials)
2. 點擊「建立憑證」→「OAuth 2.0 用戶端 ID」
3. 應用程式類型：選擇「網頁應用程式」
4. 名稱：`grandma-linebot-admin`
5. 已授權的重新導向 URI：
   ```
   https://your-admin-domain.zeabur.app/api/auth/callback/google
   ```
   **重要**：請替換為您實際的後台網址
6. 點擊「建立」
7. 複製 Client ID 和 Client Secret
8. 在後台「系統設定」頁面填入

**Callback URL 格式**：
- 開發環境：`http://localhost:3001/api/auth/callback/google`
- 正式環境：`https://your-actual-domain/api/auth/callback/google`

### Line Login（可選）

如果要支援使用 Line 帳號登入後台：

1. 前往 [Line Developers Console](https://developers.line.biz/console/)
2. 建立新的 Line Login Channel（不是 Messaging API）
3. 在 Channel Settings 中設定 Callback URL：
   ```
   https://your-admin-domain.zeabur.app/api/auth/callback/line
   ```
4. 複製 Channel ID 和 Channel Secret
5. 在後台填入

**建議**：
- 如果只有少數管理員，Google OAuth 已足夠
- Line Login 可作為備用登入方式

---

## 5. 🔧 進階設定

### 內部 API URLs

**用途**：讓不同服務之間能夠互相通訊

#### LineBot API URL
- **格式**：`https://linebot-api-xxx.zeabur.app`
- **如何取得**：
  1. 在 Zeabur Dashboard 中
  2. 點擊 `linebot-api` 服務
  3. 複製「Domains」中顯示的 URL
- **用途**：
  - n8n 工作流程會呼叫此 API
  - 後台查詢對話記錄時會使用

#### Admin API URL
- **格式**：`https://admin-xxx.zeabur.app`
- **如何取得**：
  1. 在 Zeabur Dashboard 中
  2. 點擊 `admin-dashboard` 服務
  3. 複製「Domains」中顯示的 URL
- **用途**：系統內部參考

**通常不需修改**：
- 系統會自動偵測這些 URL
- 只有在使用自訂網域時才需要手動設定

---

## 配置儲存與安全

### 加密機制

系統會自動加密以下敏感配置：

- ✅ Line Bot Channel Secret 和 Access Token
- ✅ Gemini API KEYs
- ✅ n8n API KEY
- ✅ Google Drive 憑證
- ✅ OAuth Client Secrets

**加密方式**：
- 使用 AES-256-GCM 演算法
- 每次加密都會生成唯一的鹽值和 IV
- 加密金鑰儲存在 Zeabur 環境變數中（`ENCRYPTION_KEY`）

### 顯示與編輯

**查看配置時**：
- API KEYs 會被遮蔽，只顯示前 8 個和後 4 個字元
- 範例：`AIzaSyB4************fnfQ`

**編輯配置時**：
- 需要重新輸入完整的 API KEY
- 系統會自動加密後儲存

### 配置歷史

系統會記錄：
- 誰在何時更新了配置
- 可在「系統日誌」中查看配置變更記錄

---

## 配置檢查清單

完成所有配置後，請確認：

### 必要配置（系統無法運作）
- [ ] Line Bot Channel Secret 和 Access Token
- [ ] Gemini 免費版 API KEY
- [ ] n8n API URL 和 API KEY

### 重要配置（影響功能）
- [ ] Gemini 付費版 API KEY（圖片生成功能需要）
- [ ] Google OAuth（後台登入需要）

### 可選配置（增強功能）
- [ ] Google Drive（永久儲存圖片）
- [ ] Line Login（備用登入方式）

---

## 常見問題

### Q1：配置後系統多久會生效？

**A**：立即生效。配置儲存後，系統會自動刷新快取並載入新配置。

### Q2：可以修改已儲存的配置嗎？

**A**：可以。直接在「系統設定」頁面修改並儲存即可。

### Q3：如果 API KEY 洩漏怎麼辦？

**A**：
1. 立即前往對應的服務（Google AI Studio、Line Console 等）
2. 撤銷舊的 API KEY
3. 生成新的 API KEY
4. 在後台「系統設定」頁面更新

### Q4：免費版和付費版 Gemini KEY 可以使用同一個嗎？

**A**：
- 技術上可以，但不建議
- 分開使用可以更好地追蹤成本
- 免費版有配額限制，付費版可以確保圖片生成不受影響

### Q5：Google Drive 不小心刪除了怎麼辦？

**A**：
- 如果刪除了 Google Drive 資料夾或圖片，Line 中的圖片會顯示失效
- 建議定期備份重要圖片
- 系統會在每次生成圖片後立即上傳，不會在本地保留副本

### Q6：n8n API KEY 在哪裡生成？

**A**：
- 登入您的 n8n 平台（不是在這個後台系統）
- Settings → API → Create API Key
- 如果找不到，請確認您的 n8n 版本支援 API（需要 v1.0+）

### Q7：配置會被推送到 GitHub 嗎？

**A**：
- **不會**。所有配置都儲存在資料庫中
- 資料庫不會被推送到 GitHub
- 敏感的配置檔案已被 `.gitignore` 排除

---

## 配置最佳實踐

### 1. 定期檢查健康狀態

- 每週進入「🏥 系統健康檢查」頁面查看
- 確認所有服務都是綠色（正常）
- 如果有警告，及時處理

### 2. 監控 API 使用量

- 在「系統設定」頁面查看 API 使用統計
- 免費版 Gemini API 有配額限制
- 如果接近配額，考慮：
  - 減少圖片生成頻率
  - 使用付費版 KEY
  - 優化 AI 對話長度

### 3. 備份配置資訊

- 建議將所有 API KEYs 和憑證備份到安全的地方
- 使用密碼管理器（如 1Password、Bitwarden）
- 不要儲存在純文字檔案或 Email 中

### 4. 最小權限原則

- Service Account 只給予必要的權限
- OAuth 應用只請求需要的 Scopes
- 定期檢查並撤銷不需要的權限

---

## 測試配置

完成所有配置後，建議進行以下測試：

### 1. Line Bot 測試
1. 用手機加入 Line Bot 好友
2. 傳送測試訊息
3. 確認 Bot 有回覆

### 2. n8n 工作流程測試
1. 進入「🔄 n8n 工作流程管理」頁面
2. 點擊「重新部署所有工作流程」
3. 確認所有工作流程狀態為「啟用」
4. 查看執行記錄

### 3. 圖片生成測試
1. 在 Line 中與 Bot 對話，觸發圖片生成
2. 確認圖片正常顯示
3. 檢查 Google Drive 中是否有新圖片

### 4. AI 管家測試
1. 進入「🤖 AI 管家」頁面
2. 嘗試詢問「目前有幾位用戶？」
3. 確認 AI 能正確回答

---

## 故障排除

### 配置儲存失敗

**可能原因**：
- 資料庫連接失敗
- API KEY 格式錯誤
- 權限不足

**解決方式**：
1. 檢查「🏥 系統健康檢查」中的資料庫狀態
2. 確認輸入的 API KEY 沒有多餘空格
3. 查看「📊 系統日誌」中的錯誤訊息

### 測試連接失敗

**Line Bot**：
- 確認 Channel Secret 和 Access Token 正確
- 檢查 Token 是否已過期
- 確認 Channel 已啟用

**n8n**：
- 確認 API URL 格式正確（以 `/api/v1` 結尾）
- 確認 API KEY 有效
- 測試 n8n 平台是否可以從外部存取

**Gemini API**：
- 確認 API KEY 格式正確（以 `AIzaSy` 開頭）
- 檢查是否已啟用 Gemini API
- 確認配額未用盡

**Google Drive**：
- 確認 Service Account JSON 格式正確
- 確認服務帳戶已加入資料夾的編輯者
- 確認資料夾 ID 正確

---

## 安全建議

### 🔒 保護您的 API KEYs

1. **不要分享**：不要將 API KEYs 傳送給他人
2. **定期輪換**：建議每 3-6 個月更換一次
3. **監控使用**：定期查看 API 使用記錄，偵測異常
4. **撤銷舊金鑰**：更換新金鑰後，記得撤銷舊金鑰

### 🛡️ 存取控制

1. **限制管理員數量**：只給予必要的人員後台存取權限
2. **使用強密碼**：OAuth 帳號使用強密碼和雙因素認證
3. **記錄追蹤**：系統會自動記錄所有配置變更

### 📊 監控與告警

1. **啟用日誌監控**：定期查看「📊 系統日誌」
2. **設定告警**：可以在日誌頁面設定關鍵錯誤告警
3. **健康檢查**：每週執行一次「完整健康檢查」

---

## 附錄：配置鍵名對照表

系統內部使用的配置鍵名：

| 配置項目 | 鍵名 | 是否加密 |
|---------|------|---------|
| Line Bot 配置 | `line_bot_config` | ✅ 是 |
| Gemini API KEYs | `gemini_api_keys` | ✅ 是 |
| n8n 配置 | `n8n_config` | ✅ 是 |
| Google Drive 配置 | `google_drive_config` | ✅ 是 |
| OAuth Providers | `oauth_providers` | ✅ 是 |
| AI 模型配置 | `ai_models_config` | ❌ 否 |
| 系統 URLs | `system_urls` | ❌ 否 |

---

## 支援與協助

如果在配置過程中遇到問題：

1. **查看日誌**：「📊 系統日誌」頁面包含詳細的錯誤資訊
2. **健康檢查**：「🏥 系統健康檢查」顯示所有服務狀態
3. **AI 管家**：在「🤖 AI 管家」詢問配置相關問題

祝您配置順利！ 🎉
