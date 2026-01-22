import { prisma } from './database.config.js';

export interface ModelConfiguration {
  linebotReplyModel: string;
  aiButlerDefaultModel: string;
  morningMessageModel: string;
  userProfileAnalysisModel: string;
}

export const DEFAULT_MODEL_CONFIG: ModelConfiguration = {
  linebotReplyModel: 'gemini-2.5-flash',
  aiButlerDefaultModel: 'gemini-2.5-pro',
  morningMessageModel: 'gemini-2.5-flash',
  userProfileAnalysisModel: 'gemini-2.5-pro'
};

export class ModelConfigService {
  /**
   * 獲取系統模型配置
   */
  static async getModelConfig(): Promise<ModelConfiguration> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'ai_models_config' }
      });

      if (config) {
        return JSON.parse(config.value) as ModelConfiguration;
      }
    } catch (error) {
      console.warn('Failed to load model config from database:', error);
    }

    return DEFAULT_MODEL_CONFIG;
  }

  /**
   * 更新系統模型配置
   */
  static async updateModelConfig(config: ModelConfiguration, updatedBy: string) {
    await prisma.systemConfig.upsert({
      where: { key: 'ai_models_config' },
      update: {
        value: JSON.stringify(config),
        updatedBy,
        updatedAt: new Date()
      },
      create: {
        key: 'ai_models_config',
        value: JSON.stringify(config),
        description: 'AI 模型配置',
        updatedBy
      }
    });

    console.log('✅ Model configuration updated');
  }

  /**
   * 初始化預設配置（如果不存在）
   */
  static async initializeDefaultConfig() {
    const existing = await prisma.systemConfig.findUnique({
      where: { key: 'ai_models_config' }
    });

    if (!existing) {
      await prisma.systemConfig.create({
        data: {
          key: 'ai_models_config',
          value: JSON.stringify(DEFAULT_MODEL_CONFIG),
          description: 'AI 模型配置',
          updatedBy: 'system'
        }
      });
      console.log('✅ Initialized default model configuration');
    }
  }
}
