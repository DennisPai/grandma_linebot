import express from 'express';
import { prisma } from '../config/database.config.js';
import { MemoryService } from '../services/memoryService.js';
import { UserProfileService } from '../services/userProfileService.js';

const router = express.Router();

// 檢查哪些用戶需要發送早安訊息
router.get('/check-morning-schedule', async (req, res) => {
  try {
    const now = new Date();
    
    // 查找需要發送早安訊息的用戶
    const schedules = await prisma.morningSchedule.findMany({
      where: {
        enabled: true,
        nextSendTime: {
          lte: now
        }
      },
      include: {
        user: true
      }
    });

    const users = schedules.map(schedule => ({
      userId: schedule.userId,
      displayName: schedule.user.displayName,
      scheduledTime: schedule.nextSendTime
    }));

    console.log(`📅 Found ${users.length} users need morning greeting`);
    res.json({ users });
  } catch (error) {
    console.error('❌ Error checking morning schedule:', error);
    res.status(500).json({ error: 'Failed to check morning schedule' });
  }
});

// 取得所有活躍用戶（供 n8n 用戶畫像分析使用）
router.get('/active-users', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const users = await MemoryService.getActiveUsers(days);
    
    console.log(`📊 Found ${users.length} active users in last ${days} days`);
    res.json({ 
      users: users.map(u => ({
        userId: u.userId,
        displayName: u.displayName,
        lastActiveAt: u.lastActiveAt
      }))
    });
  } catch (error) {
    console.error('❌ Error getting active users:', error);
    res.status(500).json({ error: 'Failed to get active users' });
  }
});

// 分析用戶畫像（供 n8n 呼叫）
router.post('/analyze-profile', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const profile = await UserProfileService.forceAnalyzeProfile(userId);
    
    console.log(`✅ Profile analyzed for ${userId}`);
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error('❌ Error analyzing profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// 對話品質分析（供 n8n 呼叫）
router.get('/conversation-quality', async (req, res) => {
  try {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const totalConversations = await prisma.conversation.count({
      where: {
        timestamp: { gte: last24Hours }
      }
    });

    const userConversations = await prisma.conversation.count({
      where: {
        timestamp: { gte: last24Hours },
        role: 'user'
      }
    });

    const assistantConversations = await prisma.conversation.count({
      where: {
        timestamp: { gte: last24Hours },
        role: 'assistant'
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: { gte: last24Hours }
      }
    });

    console.log('📈 Conversation quality stats generated');
    res.json({
      period: '24 hours',
      stats: {
        totalConversations,
        userMessages: userConversations,
        botReplies: assistantConversations,
        activeUsers,
        avgMessagesPerUser: activeUsers > 0 ? (totalConversations / activeUsers).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('❌ Error analyzing conversation quality:', error);
    res.status(500).json({ error: 'Failed to analyze conversation quality' });
  }
});

export default router;
