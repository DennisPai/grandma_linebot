import express from 'express';
import { prisma } from '../config/database.config.js';
import { MemoryService } from '../services/memoryService.js';

const router = express.Router();

// 取得所有用戶
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { lastActiveAt: 'desc' },
      take: 100
    });
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 取得活躍用戶
router.get('/active', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const users = await MemoryService.getActiveUsers(days);
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 取得特定用戶資料
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 取得用戶對話記錄
router.get('/:userId/conversations', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const conversations = await MemoryService.getConversationHistory(userId, limit);
    res.json({ conversations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 取得用戶統計
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await MemoryService.getConversationStats(userId);
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
