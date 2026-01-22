import { prisma } from '../config/database.config.js';
import { LineService } from './lineService.js';

export class PendingMessageService {
  /**
   * 建立待審核訊息
   */
  static async createPendingMessage(data: {
    userId: string;
    messageType: 'morning' | 'reply' | 'proactive';
    content: string;
    imageUrl?: string;
    scheduledAt?: Date;
  }) {
    return await prisma.pendingMessage.create({
      data: {
        userId: data.userId,
        messageType: data.messageType,
        content: data.content,
        imageUrl: data.imageUrl,
        status: 'pending',
        scheduledAt: data.scheduledAt || new Date(),
        createdAt: new Date()
      }
    });
  }

  /**
   * 取得待審核訊息列表
   */
  static async getPendingMessages(status?: string) {
    return await prisma.pendingMessage.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  /**
   * 批准訊息
   */
  static async approveMessage(messageId: number, approvedBy: string) {
    return await prisma.pendingMessage.update({
      where: { id: messageId },
      data: {
        status: 'approved',
        approvedBy,
        reviewedAt: new Date()
      }
    });
  }

  /**
   * 拒絕訊息
   */
  static async rejectMessage(messageId: number, approvedBy: string) {
    return await prisma.pendingMessage.update({
      where: { id: messageId },
      data: {
        status: 'rejected',
        approvedBy,
        reviewedAt: new Date()
      }
    });
  }

  /**
   * 發送已批准的訊息
   */
  static async sendApprovedMessages() {
    const now = new Date();

    // 查找已批准且尚未發送的訊息
    const messages = await prisma.pendingMessage.findMany({
      where: {
        status: 'approved',
        sentAt: null,
        scheduledAt: {
          lte: now
        }
      }
    });

    console.log(`📤 Sending ${messages.length} approved messages`);

    for (const message of messages) {
      try {
        // 發送訊息
        const textMessage = LineService.createTextMessage(message.content);
        
        if (message.imageUrl) {
          // 如果有圖片，先發送圖片再發送文字
          await LineService.pushMessage(message.userId, [
            LineService.createImageMessage(message.imageUrl),
            textMessage
          ]);
        } else {
          await LineService.pushMessage(message.userId, textMessage);
        }

        // 更新狀態為已發送
        await prisma.pendingMessage.update({
          where: { id: message.id },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        });

        console.log(`✅ Sent message ${message.id} to ${message.userId}`);

        // 如果是早安訊息，更新下次發送時間
        if (message.messageType === 'morning') {
          await this.updateNextMorningTime(message.userId);
        }

      } catch (error) {
        console.error(`❌ Failed to send message ${message.id}:`, error);
      }
    }

    return messages.length;
  }

  /**
   * 更新下次早安訊息時間
   */
  private static async updateNextMorningTime(userId: string) {
    const schedule = await prisma.morningSchedule.findUnique({
      where: { userId }
    });

    if (!schedule) return;

    // 計算下次發送時間（隨機在時間窗口內）
    const nextTime = this.calculateNextMorningTime(
      schedule.sendWindowStart,
      schedule.sendWindowEnd
    );

    await prisma.morningSchedule.update({
      where: { userId },
      data: { nextSendTime: nextTime }
    });

    console.log(`🕐 Updated next morning time for ${userId}: ${nextTime.toISOString()}`);
  }

  /**
   * 計算下次早安訊息時間（在時間窗口內隨機）
   */
  private static calculateNextMorningTime(startTime: string, endTime: string): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // 轉換為分鐘
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // 隨機選擇時間
    const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes;
    const hour = Math.floor(randomMinutes / 60);
    const minute = randomMinutes % 60;

    tomorrow.setHours(hour, minute, 0, 0);
    return tomorrow;
  }
}
