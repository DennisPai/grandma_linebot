import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiClient } from '../config/gemini.config.js';
import { uploadBufferToGoogleDrive, uploadImageURLToGoogleDrive } from '../utils/googleDrive.js';
import { prisma } from '../config/database.config.js';
import type { ImageGenerationOptions } from '../types/index.js';

export class ImageService {
  /**
   * 主要圖片生成入口
   */
  static async generateImage(options: ImageGenerationOptions): Promise<string> {
    if (options.imageType === 'elder_meme') {
      const { ElderMemeService } = await import('./elderMemeService.js');
      return await ElderMemeService.generate(options);
    } else {
      return await this.generateRealisticPhoto(options);
    }
  }

  /**
   * 生成寫實照片（用於搭配對話，模擬真人分享）
   * 使用 Banana Pro - gemini-3-pro-image-preview
   */
  private static async generateRealisticPhoto(options: ImageGenerationOptions): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_PAID!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview'
    });

    // 建構寫實照片的 Prompt
    const enhancedPrompt = this.buildRealisticPhotoPrompt(options);

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }]
      });

      const imageUrl = result.response.text();

      // 記錄 API 使用
      await this.logAPIUsage({
        service: 'banana_pro',
        model: 'gemini-3-pro-image-preview',
        tier: 'paid',
        operation: 'realistic_photo',
        cost: 0.015
      });

      // 上傳到 Google Drive 永久儲存
      const permanentUrl = await uploadImageURLToGoogleDrive(imageUrl, {
        filename: `realistic_${Date.now()}.jpg`,
        folder: `realistic/${new Date().toISOString().slice(0, 7)}` // 按月分類
      });

      return permanentUrl;
    } catch (error: any) {
      console.error('❌ Realistic photo generation failed:', error);
      throw error;
    }
  }

  /**
   * 建構寫實照片的 Prompt
   */
  private static buildRealisticPhotoPrompt(options: ImageGenerationOptions): string {
    const { prompt, conversationContext, phoneAngle = 'handheld' } = options;

    let basePrompt = `生成一張真實的手機拍攝照片：${prompt}。

【拍攝要求】
- 照片風格：真實的手機拍攝效果，略有顆粒感和自然光線
- 照片比例：9:16 豎屏或 4:3 手機相機比例
- 拍攝角度：${this.getAngleDescription(phoneAngle)}
- 照片質感：日常隨拍感，不要過度修飾或專業攝影棚效果
- 光線：自然光線，可以有輕微的手震或焦距不準

【場景要求】
- 展現台灣日常生活場景`;

    // 根據對話上下文調整
    if (conversationContext?.includes('市場') || conversationContext?.includes('買菜')) {
      basePrompt += `
- 場景：台灣傳統市場或超市
- 包含：新鮮蔬果、攤位、塑膠袋
- 視角：手持手機從上往下拍攝商品的第一人稱視角`;
    }

    if (conversationContext?.includes('晨跑') || conversationContext?.includes('運動')) {
      basePrompt += `
- 場景：公園或河濱步道
- 包含：跑道、綠樹、晨光
- 視角：手機平舉拍攝前方道路或自拍`;
    }

    if (conversationContext?.includes('煮') || conversationContext?.includes('料理')) {
      basePrompt += `
- 場景：廚房或餐桌
- 包含：精緻料理、餐具
- 視角：桌面俯拍餐點`;
    }

    // 自拍特殊要求
    if (phoneAngle === 'selfie') {
      basePrompt += `

【重要】自拍特殊要求：
- 人物必須戴著口罩（醫療口罩或布口罩）
- 自拍角度：略微俯視，手臂伸長拍攝
- 背景：日常生活場景（如客廳、戶外、咖啡廳等）
- 人物：中年男性，穿著休閒得體（如 polo 衫、襯衫）
- 絕對不可以沒戴口罩`;
    }

    basePrompt += `

【禁止】
- 不要有任何浮水印或文字疊加
- 不要使用專業攝影棚或打光
- 不要過度美化或濾鏡效果
- 如果是自拍，絕對不可以沒戴口罩`;

    return basePrompt;
  }

  /**
   * 取得拍攝角度描述
   */
  private static getAngleDescription(angle: string): string {
    switch (angle) {
      case 'selfie':
        return '自拍模式，前鏡頭拍攝，略微俯視角度，手臂伸長';
      case 'first_person':
        return '第一人稱視角，從拍攝者的眼睛高度往前拍攝';
      case 'handheld':
        return '手持拍攝，略微不穩定的角度，自然的日常拍攝感';
      default:
        return '自然的手機拍攝角度';
    }
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
