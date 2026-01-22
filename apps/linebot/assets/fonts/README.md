# 繁體中文字型

本資料夾存放用於長輩圖文字渲染的繁體中文字型檔案。

## 需要的字型

### 1. Noto Sans TC (思源黑體繁體中文)

下載來源：https://fonts.google.com/noto/specimen/Noto+Sans+TC

需要的檔案：
- `NotoSansTC-Bold.ttf` - 粗體（主要用於長輩圖標題）
- `NotoSansTC-Regular.ttf` - 常規體（備用）

### 下載步驟

1. 前往 https://fonts.google.com/noto/specimen/Noto+Sans+TC
2. 點擊「Download family」
3. 解壓縮下載的 ZIP 檔案
4. 將以下檔案複製到此資料夾：
   - `NotoSansTC-Bold.ttf`
   - `NotoSansTC-Regular.ttf`

### 自動化下載（選用）

或使用以下命令自動下載：

```bash
cd apps/linebot/assets/fonts
curl -L "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/Traditional Chinese/NotoSansTC-Bold.otf" -o NotoSansTC-Bold.ttf
curl -L "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/Traditional Chinese/NotoSansTC-Regular.otf" -o NotoSansTC-Regular.ttf
```

## 字型授權

Noto Sans TC 使用 SIL Open Font License 1.1，可以免費使用。

## 使用方式

字型已在 `textRendererService.ts` 中自動註冊，無需額外配置。

如果字型檔案不存在，系統會使用系統預設字型作為備用方案。
