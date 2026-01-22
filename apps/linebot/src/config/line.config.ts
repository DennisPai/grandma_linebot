import { ClientConfig, MiddlewareConfig } from '@line/bot-sdk';

// 確保環境變數存在
const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.warn('Warning: LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN not set');
}

// ClientConfig 用於 Line Client
export const lineConfig: ClientConfig = {
  channelSecret,
  channelAccessToken
};

// MiddlewareConfig 用於 webhook middleware
export const middlewareConfig: MiddlewareConfig = {
  channelSecret: channelSecret as string // 強制轉型為 string
};
