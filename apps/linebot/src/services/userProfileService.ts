import { getGeminiClient } from '../config/gemini.config.js';
import { prisma } from '../config/database.config.js';
import { MemoryService } from './memoryService.js';

export class UserProfileService {
  /**
   * 分析對話並提取用戶畫像
   * 每 10 條對話觸發一次更新
   */
  static async analyzeAndUpdateProfile(userId: string): Promise<void> {
    try {
      // 檢查是否需要更新（每 10 條對話更新一次）
      const conversationCount = await prisma.conversation.count({
        where: { userId }
      });

      if (conversationCount % 10 !== 0 && conversationCount > 0) {
        // 不是 10 的倍數，跳過
        return;
      }

      console.log(`🔍 Analyzing user profile for ${userId}`);

      // 取得最近 50 條對話
      const conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 50
      });

      if (conversations.length < 5) {
        console.log('⏭️ Not enough conversations for profile analysis');
        return;
      }

      // 使用 AI 分析對話並提取資訊
      const profile = await this.extractProfileFromConversations(conversations);

      // 更新用戶畫像
      await MemoryService.updateUserProfile(userId, profile);

      console.log(`✅ Profile updated for ${userId}`);
    } catch (error) {
      console.error('❌ Error analyzing user profile:', error);
    }
  }

  /**
   * 使用 AI 從對話中提取用戶畫像
   */
  private static async extractProfileFromConversations(conversations: any[]): Promise<any> {
    // 使用免費的 gemini-2.5-pro 進行分析
    const genAI = getGeminiClient('gemini-2.5-pro');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro'
    });

    // 格式化對話內容
    const conversationText = conversations
      .reverse()
      .map(conv => {
        const role = conv.role === 'user' ? '姐姐' : '阿東';
        return `${role}：${conv.content}`;
      })
      .join('\n');

    const analysisPrompt = `
分析以下對話記錄，提取用戶（姐姐）的個人資訊和特徵。

【對話記錄】
${conversationText}

請以 JSON 格式回答（只輸出 JSON，不要其他文字）：
{
  "interests": ["興趣1", "興趣2"],
  "family": "家庭狀況描述",
  "health": "健康狀況描述",
  "investmentAttitude": "投資態度描述",
  "personality": "性格特點描述",
  "lifestyle": "生活型態描述",
  "concerns": ["關注的事項1", "關注的事項2"],
  "summary": "整體摘要（100字以內）"
}

【提取要點】
1. 只提取對話中明確提及的資訊，不要推測
2. 如果某項資訊未提及，該欄位填入空字串或空陣列
3. 特別注意家庭成員、健康狀況、投資經驗等關鍵資訊
4. 記錄用戶的興趣愛好和生活習慣
5. 注意用戶的情緒和關注點
`;

    const result = await model.generateContent(analysisPrompt);
    const responseText = result.response.text();

    // 提取 JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('AI did not return valid JSON, using empty profile');
      return {};
    }

    const profile = JSON.parse(jsonMatch[0]);
    console.log('📊 Extracted profile:', profile);

    return profile;
  }

  /**
   * 手動觸發用戶畫像分析（供後台使用）
   */
  static async forceAnalyzeProfile(userId: string): Promise<any> {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    if (conversations.length === 0) {
      throw new Error('No conversations found for this user');
    }

    const profile = await this.extractProfileFromConversations(conversations);

    await prisma.user.update({
      where: { userId },
      data: {
        profileSummary: profile
      }
    });

    return profile;
  }
}
