import { Client, TextMessage, ImageMessage } from '@line/bot-sdk';
import { configLoader } from '../config/configLoader.js';

let lineClient: Client | null = null;

/**
 * 懶加載 Line Client
 * 第一次使用時才初始化，從資料庫或環境變數載入配置
 */
async function getLineClient(): Promise<Client> {
  if (lineClient) {
    return lineClient;
  }

  try {
    // 優先從資料庫載入配置
    const config = await configLoader.loadConfigs([
      'LINE_CHANNEL_SECRET',
      'LINE_CHANNEL_ACCESS_TOKEN'
    ]);

    const channelSecret = config.LINE_CHANNEL_SECRET;
    const channelAccessToken = config.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelSecret || !channelAccessToken) {
      throw new Error('LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN not configured');
    }

    lineClient = new Client({
      channelSecret,
      channelAccessToken
    });

    console.log('✅ Line Client initialized successfully');
    return lineClient;
  } catch (error) {
    console.error('❌ Failed to initialize Line Client:', error);
    throw error;
  }
}

export class LineService {
  /**
   * 使用 Reply Token 回覆訊息（30秒內有效）
   */
  static async replyMessage(replyToken: string, messages: TextMessage | ImageMessage | (TextMessage | ImageMessage)[]) {
    try {
      const client = await getLineClient();
      const messageArray = Array.isArray(messages) ? messages : [messages];
      await client.replyMessage(replyToken, messageArray);
      console.log('✅ Message replied successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to reply message:', error.message);
      throw error;
    }
  }

  /**
   * 使用 Push API 主動發送訊息
   */
  static async pushMessage(userId: string, messages: TextMessage | ImageMessage | (TextMessage | ImageMessage)[]) {
    try {
      const client = await getLineClient();
      const messageArray = Array.isArray(messages) ? messages : [messages];
      await client.pushMessage(userId, messageArray);
      console.log(`✅ Message pushed to ${userId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to push message:', error.message);
      throw error;
    }
  }

  /**
   * 取得用戶資料
   */
  static async getUserProfile(userId: string) {
    try {
      const client = await getLineClient();
      const profile = await client.getProfile(userId);
      return profile;
    } catch (error: any) {
      console.error(`❌ Failed to get user profile for ${userId}:`, error.message);
      return null;
    }
  }

  /**
   * 建立文字訊息
   */
  static createTextMessage(text: string): TextMessage {
    return {
      type: 'text',
      text
    };
  }

  /**
   * 建立圖片訊息
   */
  static createImageMessage(imageUrl: string, previewImageUrl?: string): ImageMessage {
    return {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: previewImageUrl || imageUrl
    };
  }
}
