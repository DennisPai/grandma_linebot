import { prisma } from '../config/database.config.js';
import type { Message, UserProfile } from '@grandma-linebot/shared';

export class MemoryService {
  /**
   * 獲取用戶的對話歷史
   */
  static async getConversationHistory(
    userId: string,
    limit: number = 10
  ): Promise<Message[]> {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return conversations.reverse().map(conv => ({
      id: conv.id,
      userId: conv.userId,
      role: conv.role as 'user' | 'assistant' | 'system',
      content: conv.content,
      hasImage: conv.hasImage,
      imageUrl: conv.imageUrl || undefined,
      metadata: conv.metadata as Record<string, any> | undefined,
      timestamp: conv.timestamp
    }));
  }

  /**
   * 儲存對話記錄
   */
  static async saveConversation(data: {
    userId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    hasImage?: boolean;
    imageUrl?: string;
    metadata?: Record<string, any>;
  }) {
    return await prisma.conversation.create({
      data: {
        userId: data.userId,
        role: data.role,
        content: data.content,
        hasImage: data.hasImage || false,
        imageUrl: data.imageUrl,
        metadata: data.metadata,
        status: 'approved'
      }
    });
  }

  /**
   * 獲取用戶畫像
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) {
      return {
        userId,
        displayName: '姐姐'
      };
    }

    const profileSummary = user.profileSummary as any || {};

    return {
      userId: user.userId,
      displayName: user.displayName || '姐姐',
      interests: profileSummary.interests,
      family: profileSummary.family,
      health: profileSummary.health,
      investmentAttitude: profileSummary.investmentAttitude,
      ...profileSummary
    };
  }

  /**
   * 更新用戶畫像
   */
  static async updateUserProfile(userId: string, profileData: Partial<UserProfile>) {
    const currentUser = await prisma.user.findUnique({ where: { userId } });

    if (!currentUser) {
      console.warn(`User ${userId} not found`);
      return;
    }

    const currentSummary = (currentUser.profileSummary as any) || {};
    const updatedSummary = {
      ...currentSummary,
      ...profileData
    };

    await prisma.user.update({
      where: { userId },
      data: {
        profileSummary: updatedSummary,
        lastActiveAt: new Date()
      }
    });

    console.log(`✅ Updated profile for user ${userId}`);
  }

  /**
   * 取得所有活躍用戶
   */
  static async getActiveUsers(daysActive: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysActive);

    return await prisma.user.findMany({
      where: {
        lastActiveAt: {
          gte: cutoffDate
        }
      },
      orderBy: {
        lastActiveAt: 'desc'
      }
    });
  }

  /**
   * 計算對話統計
   */
  static async getConversationStats(userId: string) {
    const totalConversations = await prisma.conversation.count({
      where: { userId }
    });

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentConversations = await prisma.conversation.count({
      where: {
        userId,
        timestamp: {
          gte: last7Days
        }
      }
    });

    return {
      totalConversations,
      recentConversations,
      lastActive: await prisma.user.findUnique({
        where: { userId },
        select: { lastActiveAt: true }
      })
    };
  }
}
