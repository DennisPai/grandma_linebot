import { Client, TextMessage, ImageMessage } from '@line/bot-sdk';
import { lineConfig } from '../config/line.config.js';

export const lineClient = new Client(lineConfig);

export class LineService {
  /**
   * 使用 Reply Token 回覆訊息（30秒內有效）
   */
  static async replyMessage(replyToken: string, messages: TextMessage | ImageMessage | (TextMessage | ImageMessage)[]) {
    try {
      const messageArray = Array.isArray(messages) ? messages : [messages];
      await lineClient.replyMessage(replyToken, messageArray);
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
      const messageArray = Array.isArray(messages) ? messages : [messages];
      await lineClient.pushMessage(userId, messageArray);
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
      const profile = await lineClient.getProfile(userId);
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
