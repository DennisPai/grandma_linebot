import express from 'express';
import { WebhookEvent, MessageEvent, TextEventMessage } from '@line/bot-sdk';
import { LineService } from '../services/lineService.js';
import { ReplyStrategy } from '../utils/replyStrategy.js';
import { prisma } from '../config/database.config.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Line Webhook 處理器
router.post('/', async (req, res) => {
  const events: WebhookEvent[] = req.body.events;
  const traceId = logger.generateTraceId();

  logger.info('Line webhook received', { 
    traceId,
    service: 'linebot',
    action: 'webhook_received',
    eventCount: events.length
  });

  try {
    // 處理所有事件（並行處理以提升效能）
    await Promise.all(events.map(event => handleEvent(event, traceId)));
    res.status(200).send('OK');
    
    logger.debug('Webhook processed successfully', {
      traceId,
      service: 'linebot',
      eventCount: events.length
    });
  } catch (error) {
    logger.error('Webhook processing failed', error, {
      traceId,
      service: 'linebot',
      action: 'webhook_error'
    });
    res.status(500).send('Error processing webhook');
  }
});

async function handleEvent(event: WebhookEvent, traceId: string) {
  logger.info(`Received event: ${event.type}`, {
    traceId,
    service: 'linebot',
    action: 'event_received',
    eventType: event.type,
    userId: event.source.userId
  });

  // 處理訊息事件
  if (event.type === 'message' && event.message.type === 'text') {
    return handleTextMessage(event, traceId);
  }

  // 處理加入好友事件
  if (event.type === 'follow') {
    return handleFollowEvent(event, traceId);
  }

  // 處理取消好友事件
  if (event.type === 'unfollow') {
    return handleUnfollowEvent(event, traceId);
  }
}

async function handleTextMessage(event: MessageEvent, traceId: string) {
  const message = event.message as TextEventMessage;
  const userId = event.source.userId;

  if (!userId) {
    logger.warn('No userId in text message event', {
      traceId,
      service: 'linebot',
      action: 'missing_user_id'
    });
    return;
  }

  logger.info(`User message received`, {
    traceId,
    service: 'linebot',
    action: 'message_received',
    userId,
    messageLength: message.text.length
  });

  const endTimer = logger.startTimer('handleTextMessage', { traceId, userId });

  try {
    // 確保用戶存在
    await ensureUserExists(userId, traceId);

    // 儲存用戶訊息到資料庫
    await prisma.conversation.create({
      data: {
        userId,
        role: 'user',
        content: message.text,
        hasImage: false,
        status: 'approved'
      }
    });

    logger.debug('User message saved to database', {
      traceId,
      userId,
      service: 'linebot'
    });

    // 使用 ReplyStrategy 處理回覆（含 30 秒超時處理）
    await ReplyStrategy.handleIncomingMessage(event, traceId);

    endTimer();
  } catch (error) {
    logger.error('Error handling text message', error, {
      traceId,
      userId,
      service: 'linebot',
      action: 'handle_message_error'
    });
  }
}

async function handleFollowEvent(event: WebhookEvent, traceId: string) {
  if (!event.source.userId) return;

  const userId = event.source.userId;
  
  logger.info('New user followed', {
    traceId,
    userId,
    service: 'linebot',
    action: 'user_follow'
  });

  try {
    // 取得用戶資料
    const profile = await LineService.getUserProfile(userId);

    // 建立用戶記錄
    await prisma.user.upsert({
      where: { userId },
      update: {
        lastActiveAt: new Date()
      },
      create: {
        userId,
        displayName: profile?.displayName || '姐姐',
        firstContactAt: new Date(),
        lastActiveAt: new Date()
      }
    });

    // 建立早安訊息排程（預設 07:00-08:00）
    await prisma.morningSchedule.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        nextSendTime: getNextMorningTime(),
        sendWindowStart: '07:00',
        sendWindowEnd: '08:00',
        timezone: 'Asia/Taipei',
        enabled: true
      }
    });

    logger.info('User initialized successfully', {
      traceId,
      userId,
      service: 'linebot',
      action: 'user_initialized',
      displayName: profile?.displayName
    });

    // 發送歡迎訊息（使用類型守衛確保 replyToken 存在）
    if ('replyToken' in event && event.replyToken) {
      await LineService.replyMessage(
        event.replyToken,
        LineService.createTextMessage('姐姐好！我是阿東，很高興認識你 😊')
      );
      
      logger.info('Welcome message sent', {
        traceId,
        userId,
        service: 'linebot'
      });
    }

  } catch (error) {
    logger.error('Error handling follow event', error, {
      traceId,
      userId,
      service: 'linebot',
      action: 'follow_error'
    });
  }
}

async function handleUnfollowEvent(event: WebhookEvent, traceId: string) {
  if (!event.source.userId) return;

  const userId = event.source.userId;
  
  logger.info('User unfollowed', {
    traceId,
    userId,
    service: 'linebot',
    action: 'user_unfollow'
  });

  // 可以選擇保留資料或軟刪除
  // 這裡選擇保留資料，只停用早安訊息
  try {
    await prisma.morningSchedule.updateMany({
      where: { userId },
      data: { enabled: false }
    });
    
    logger.info('Morning schedule disabled', {
      traceId,
      userId,
      service: 'linebot',
      action: 'schedule_disabled'
    });
  } catch (error) {
    logger.error('Error handling unfollow event', error, {
      traceId,
      userId,
      service: 'linebot',
      action: 'unfollow_error'
    });
  }
}

async function ensureUserExists(userId: string, traceId: string) {
  const user = await prisma.user.findUnique({ where: { userId } });

  if (!user) {
    // 用戶不存在，建立新記錄
    const profile = await LineService.getUserProfile(userId);
    
    await prisma.user.create({
      data: {
        userId,
        displayName: profile?.displayName || '姐姐',
        firstContactAt: new Date(),
        lastActiveAt: new Date()
      }
    });

    logger.info('New user created', {
      traceId,
      userId,
      service: 'linebot',
      action: 'user_created',
      displayName: profile?.displayName
    });
  } else {
    // 更新最後活躍時間
    await prisma.user.update({
      where: { userId },
      data: { lastActiveAt: new Date() }
    });
    
    logger.debug('User last active time updated', {
      traceId,
      userId,
      service: 'linebot'
    });
  }
}

function getNextMorningTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(7, 0, 0, 0); // 明天早上 7:00
  return tomorrow;
}

export default router;
