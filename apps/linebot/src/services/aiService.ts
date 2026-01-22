import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiClient, getModelConfig } from '../config/gemini.config.js';
import { prisma } from '../config/database.config.js';
import { PromptBuilder } from '../utils/promptBuilder.js';
import { RAGService } from './ragService.js';
import type { ConversationContext, UserProfile } from '../types/index.js';

export class AIService {
  /**
   * 生成 AI 回覆
   */
  static async generateResponse(context: ConversationContext): Promise<string> {
    try {
      // 1. 從 RAG 知識庫檢索相關文檔
      const relevantDocs = await RAGService.retrieveRelevant(
        context.userMessage,
        context.userProfile.interests,
        { topK: 3 }
      );

      // 2. 建構完整 Prompt
      const systemPrompt = PromptBuilder.buildSystemPrompt({
        userProfile: context.userProfile,
        relevantKnowledge: relevantDocs,
        conversationHistory: context.conversationHistory.slice(-10)
      });

      // 3. 取得系統配置的模型（預設使用 gemini-2.5-flash）
      const modelName = await this.getConfiguredModel('linebotReplyModel');
      const genAI = getGeminiClient(modelName);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt
      });

      // 4. 生成回覆
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: context.userMessage }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 250,
          topP: 0.9
        }
      });

      const responseText = result.response.text();

      // 5. 記錄 API 使用
      const modelConfig = getModelConfig(modelName);
      await this.logAPIUsage({
        service: 'gemini',
        model: modelName,
        tier: modelConfig.tier,
        operation: 'chat',
        userId: context.userProfile.userId,
        cost: 0 // 免費模型
      });

      return responseText;
    } catch (error: any) {
      console.error('❌ AI generation error:', error);
      throw error;
    }
  }


  /**
   * 取得系統配置的模型
   */
  private static async getConfiguredModel(key: keyof import('../config/models.config.js').ModelConfiguration): Promise<string> {
    const { ModelConfigService } = await import('../config/models.config.js');
    const config = await ModelConfigService.getModelConfig();
    return config[key];
  }

  /**
   * 記錄 API 使用
   */
  private static async logAPIUsage(data: {
    service: string;
    model: string;
    tier: string;
    operation?: string;
    userId?: string;
    tokensUsed?: number;
    cost: number;
  }) {
    try {
      await prisma.aPIUsageLog.create({
        data: {
          ...data,
          success: true,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  }
}
