import express from 'express';
import { PendingMessageService } from '../services/pendingMessageService.js';

const router = express.Router();

// 建立待審核訊息
router.post('/pending', async (req, res) => {
  try {
    const { userId, content, imageUrl, messageType } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    const message = await PendingMessageService.createPendingMessage({
      userId,
      messageType: messageType || 'proactive',
      content,
      imageUrl
    });

    res.json({ success: true, messageId: message.id });
  } catch (error: any) {
    console.error('Error creating pending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得待審核訊息列表
router.get('/pending', async (req, res) => {
  try {
    const status = req.query.status as string;
    const messages = await PendingMessageService.getPendingMessages(status);
    res.json({ messages });
  } catch (error: any) {
    console.error('Error getting pending messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批准訊息
router.post('/pending/:id/approve', async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'approvedBy is required' });
    }

    const message = await PendingMessageService.approveMessage(messageId, approvedBy);
    res.json({ success: true, message });
  } catch (error: any) {
    console.error('Error approving message:', error);
    res.status(500).json({ error: error.message });
  }
});

// 拒絕訊息
router.post('/pending/:id/reject', async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'approvedBy is required' });
    }

    const message = await PendingMessageService.rejectMessage(messageId, approvedBy);
    res.json({ success: true, message });
  } catch (error: any) {
    console.error('Error rejecting message:', error);
    res.status(500).json({ error: error.message });
  }
});

// 發送已批准的訊息（供 n8n 定時呼叫）
router.post('/send-approved', async (req, res) => {
  try {
    const count = await PendingMessageService.sendApprovedMessages();
    res.json({ success: true, sentCount: count });
  } catch (error: any) {
    console.error('Error sending approved messages:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
