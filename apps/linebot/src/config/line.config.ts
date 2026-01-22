import { ClientConfig, MiddlewareConfig } from '@line/bot-sdk';

// 從環境變數載入配置（開發環境）或使用臨時配置（生產環境，將從資料庫載入）
const channelSecret = process.env.LINE_CHANNEL_SECRET || 'temp_secret_will_be_loaded_from_db';
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'temp_token_will_be_loaded_from_db';

if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.warn('⚠️ Line credentials not set in environment variables');
  console.warn('📌 System will attempt to load configuration from database at runtime');
}

// ClientConfig 用於 Line Client（不再使用，改用 lineService 中的懶加載）
export const lineConfig: ClientConfig = {
  channelSecret,
  channelAccessToken
};

// MiddlewareConfig 用於 webhook middleware
// 注意：這是啟動時的臨時配置，實際驗證在 webhook 處理器中進行
export const middlewareConfig: MiddlewareConfig = {
  channelSecret: channelSecret
};
