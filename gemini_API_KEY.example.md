# Gemini API KEY 設定範例

這是 Gemini API KEY 配置的範例檔案。請勿在此檔案中填入真實的 API 密鑰。

## 設定方式

部署完成後，請在後台管理系統的「系統設定」頁面輸入以下資訊：

## 免費版 Free Tier 的 KEY

### 適用模型
- gemini-3-flash-preview
- gemini-2.5-pro
- gemini-2.5-flash

### 金鑰
```
請在後台系統設定頁面輸入您的免費版 Gemini API KEY
範例格式：AIzaSy...
```

## 付費版 Tier 1 的 KEY

### 適用模型
- gemini-3-pro-image-preview (Banana Pro - 寫實照片生成)
- gemini-3-pro-preview
- gemini-2.5-flash-image (長輩圖底圖生成)

### 金鑰
```
請在後台系統設定頁面輸入您的付費版 Gemini API KEY
範例格式：AIzaSy...
```

## 如何取得 Gemini API KEY

1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 點擊「Get API Key」或「Create API Key」
3. 選擇或建立專案
4. 複製生成的 API Key
5. 在後台系統設定頁面貼上對應的 KEY

## 模型選擇策略

為了降低成本，系統會根據功能自動選擇適當的模型和 API KEY：

### 使用免費版 KEY 的功能：
- Line Bot 用戶對話回覆（gemini-2.5-flash）
- 早安訊息內容生成（gemini-2.5-flash）
- AI 管家對話（gemini-2.5-pro）
- 文檔向量化（text-embedding-004）
- 長輩圖視覺分析（gemini-2.5-flash）

### 使用付費版 KEY 的功能：
- 寫實照片生成（gemini-3-pro-image-preview / Banana Pro）
- 長輩圖底圖生成（gemini-2.5-flash-image）
- 高級 AI 分析（gemini-3-pro-preview，選用）

## 注意事項

⚠️ **重要**：
- 請勿將真實的 API KEY 提交到 Git Repository
- `gemini_API_KEY.md` 已被加入 `.gitignore`，可以在本地使用
- 所有真實的配置應該在部署後透過後台系統設定頁面輸入
- 免費版 API KEY 有使用配額限制，請在後台監控使用情況
