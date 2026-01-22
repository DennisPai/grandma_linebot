import { MessageEvent, TextEventMessage } from '@line/bot-sdk';
import { LineService } from '../services/lineService.js';
import { AIService } from '../services/aiService.js';
import { MemoryService } from '../services/memoryService.js';
import { UserProfileService } from '../services/userProfileService.js';
import { prisma } from '../config/database.config.js';
import { logger } from './logger.js';
import type { UserProfile, Message } from '../types/index.js';

const REPLY_TIMEOUT = 25000; // 25 秒安全邊界

export class ReplyStrategy {
  /**
   * 處理用戶訊息並生成回覆
   * 根據時間判斷使用 Reply Token 或 Push API
   */
  static async handleIncomingMessage(event: MessageEvent, traceId: string): Promise<void> {
    const message = event.message as TextEventMessage;
    const userId = event.source.userId!;
    const replyToken = event.replyToken;
    const startTime = Date.now();
    let hasReplied = false;

    const endTimer = logger.startTimer('handleIncomingMessage', { traceId, userId });

    try {
      // 1. 載入用戶畫像和對話歷史
      logger.debug('Loading user profile and history', {
        traceId,
        userId,
        service: 'linebot'
      });
      
      const userProfile = await MemoryService.getUserProfile(userId);
      const conversationHistory = await MemoryService.getConversationHistory(userId, 10);

      // 2. 生成 AI 回覆
      logger.info('Generating AI response', {
        traceId,
        userId,
        service: 'linebot',
        action: 'ai_generation_start',
        messageLength: message.text.length
      });
      
      const response = await AIService.generateResponse({
        userMessage: message.text,
        conversationHistory,
        userProfile
      });

      const elapsedTime = Date.now() - startTime;
      
      logger.info('AI response generated', {
        traceId,
        userId,
        service: 'linebot',
        action: 'ai_generation_complete',
        duration: elapsedTime,
        responseLength: response.length
      });

      // 3. 儲存 AI 回覆到資料庫
      await MemoryService.saveConversation({
        userId,
        role: 'assistant',
        content: response,
        hasImage: false
      });

      // 4. 觸發用戶畫像分析（非同步，不阻塞回覆）
      UserProfileService.analyzeAndUpdateProfile(userId).catch(err => {
        logger.error('Background profile analysis failed', err, {
          traceId,
          userId,
          service: 'linebot'
        });
      });

      // 5. 判斷使用 Reply Token 或 Push API
      if (elapsedTime < REPLY_TIMEOUT && !hasReplied) {
        // 在安全時間內，使用 Reply Token
        await LineService.replyMessage(
          replyToken,
          LineService.createTextMessage(response)
        );
        hasReplied = true;
        
        logger.info('Replied using Reply Token', {
          traceId,
          userId,
          service: 'linebot',
          action: 'reply_sent',
          method: 'reply_token',
          duration: elapsedTime
        });
      } else if (!hasReplied) {
        // 超過時間，使用 Push API
        await LineService.pushMessage(
          userId,
          LineService.createTextMessage(response)
        );
        hasReplied = true;
        
        logger.warn('Response timeout, used Push API', {
          traceId,
          userId,
          service: 'linebot',
          action: 'reply_sent',
          method: 'push_api',
          duration: elapsedTime
        });
      }
      
      endTimer();
    } catch (error: any) {
      logger.error('Error generating response', error, {
        traceId,
        userId,
        service: 'linebot',
        action: 'reply_error',
        duration: Date.now() - startTime
      });

      // 錯誤處理：嘗試發送錯誤訊息
      const errorMessage = LineService.createTextMessage(
        '姐姐不好意思，阿東剛剛恍神了一下，可以再說一次嗎？'
      );

      const currentElapsedTime = Date.now() - startTime;

      try {
        if (currentElapsedTime < REPLY_TIMEOUT) {
          await LineService.replyMessage(replyToken, errorMessage);
        } else {
          await LineService.pushMessage(userId, errorMessage);
        }
        
        logger.info('Error message sent to user', {
          traceId,
          userId,
          service: 'linebot',
          action: 'error_message_sent'
        });
      } catch (replyError) {
        logger.fatal('Failed to send error message', replyError, {
          traceId,
          userId,
          service: 'linebot',
          action: 'critical_error'
        });
      }
    }
  }
}
