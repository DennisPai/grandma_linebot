import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadBufferToGoogleDrive } from '@grandma-linebot/google-drive';
import { prisma } from '../config/database.config.js';
import type { ImageGenerationOptions, TextLayout } from '@grandma-linebot/shared';

export class ElderMemeService {
  /**
   * 三階段生成長輩圖
   * 1. 生成底圖（gemini-2.5-flash-image）
   * 2. AI 視覺分析（gemini-2.5-flash，免費）
   * 3. Canvas 文字渲染
   */
  static async generate(options: ImageGenerationOptions): Promise<string> {
    try {
      console.log('🎨 Starting 3-stage elder meme generation...');

      // === 階段 1：生成底圖 ===
      const backgroundUrl = await this.generateBackground(options.prompt);
      console.log('✅ Stage 1: Background generated');

      // === 階段 2：AI 視覺分析 ===
      const textLayout = await this.analyzeImageAndPlanText(backgroundUrl, options.prompt);
      console.log('✅ Stage 2: Text layout analyzed');

      // === 階段 3：Canvas 文字渲染 ===
      const { TextRendererService } = await import('./textRendererService.js');
      const finalImageBuffer = await TextRendererService.renderTextOnImage(
        backgroundUrl,
        textLayout
      );
      console.log('✅ Stage 3: Text rendered');

      // === 階段 4：上傳到 Google Drive ===
      const permanentUrl = await uploadBufferToGoogleDrive(finalImageBuffer, {
        filename: `elder_meme_${Date.now()}.jpg`,
        folder: `elder_memes/${new Date().toISOString().slice(0, 7)}`
      });

      // 記錄 API 使用
      await this.logAPIUsage();

      console.log('✅ Elder meme generation complete:', permanentUrl);
      return permanentUrl;
    } catch (error: any) {
      console.error('❌ Elder meme generation failed:', error);
      throw error;
    }
  }

  /**
   * 階段 1：生成長輩圖底圖（不含文字）
   */
  private static async generateBackground(message: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_PAID!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const prompt = this.buildBackgroundPrompt(message);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    return result.response.text();
  }

  /**
   * 階段 2：AI 視覺分析，決定文字配置
   */
  private static async analyzeImageAndPlanText(
    imageUrl: string,
    textContent: string
  ): Promise<TextLayout> {
    // 使用免費的 gemini-2.5-flash 進行視覺分析
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FREE!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    });

    // 下載圖片並轉為 base64
    const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const analysisPrompt = `
分析這張長輩圖底圖，並決定如何放置文字「${textContent}」。

請以 JSON 格式回答（只輸出 JSON，不要其他文字）：
{
  "textLines": [
    {
      "text": "文字內容",
      "x": 50,
      "y": 30,
      "fontSize": 100,
      "fontWeight": "bold",
      "fontFamily": "Noto Sans TC",
      "color": "#FFFFFF",
      "strokeColor": "#FF0000",
      "strokeWidth": 8,
      "rotation": 0,
      "shadowColor": "#000000",
      "shadowBlur": 10
    }
  ],
  "reasoning": "為什麼選擇這樣的佈局"
}

【分析要點】
1. 找出圖片中較空曠、沒有裝飾元素的區域
2. 避開顏色太亮或太暗的區域（確保文字可讀）
3. 文字要大而醒目（長輩圖特色）
4. 使用高對比的顏色（如白底紅邊、黃底黑邊）
5. 可以分成多行，每行可以有不同的大小和位置
6. x 和 y 是圖片寬度和高度的百分比位置（0-100）

【長輩圖典型風格】
- 主標題：超大字（80-120px），置中偏上（y: 20-35）
- 副標題或祝福語：中等字（50-80px），置中偏下（y: 65-80）
- 置中時 x 固定為 50
`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: analysisPrompt }
        ]
      }]
    });

    const responseText = result.response.text();

    // 提取 JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 未返回有效的 JSON 格式');
    }

    const layout = JSON.parse(jsonMatch[0]);
    console.log('📐 AI 分析結果:', layout.reasoning);

    return layout as TextLayout;
  }

  /**
   * 建構底圖 Prompt
   */
  private static buildBackgroundPrompt(message: string): string {
    const styles = ['早安祝福', '勵志語錄', '健康提醒', '溫馨問候', '正能量'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const backgroundElements = this.determineBackgroundElements(message, randomStyle);

    return `生成一張典型的「長輩圖」風格底圖背景：

【重要】此圖片不要包含任何文字，只需要背景和裝飾元素！

【內容主題】
主題：${message}
類型：${randomStyle}
適合的元素：${backgroundElements}

【背景設計要求】
1. 色彩：
   - 使用鮮豔飽和的漸層色彩（如粉紅到金黃、天藍到紫色）
   - 可以有光暈、光芒效果
   - 整體明亮溫暖

2. 裝飾元素：
   - 花卉裝飾（玫瑰、向日葵、蝴蝶等）
   - 可以有可愛的卡通圖案
   - 愛心、星星、光芒等裝飾
   - 元素主要放在四周或邊角，中央留出空間供文字放置

3. 構圖：
   - 確保中央區域有足夠的空間（至少 60% 的畫面）
   - 裝飾元素不要過度密集
   - 避免在中央放置會干擾文字閱讀的元素

4. 風格：
   - 充滿正能量和溫暖感
   - 類似 2010 年代的社群媒體分享圖
   - 帶有懷舊或俗豔感（這是長輩圖的特色）
   - 視覺衝擊力強

【禁止】
- 不要包含任何文字或文字符號
- 不要生成過於複雜的圖案（會干擾後續文字疊加）
- 不要使用純色背景（要有漸層或裝飾）

請確保這個底圖適合用來製作長輩會在社群媒體上分享的圖片。`;
  }

  /**
   * 根據訊息內容決定適合的背景元素
   */
  private static determineBackgroundElements(message: string, style: string): string {
    const elementMap: Record<string, string[]> = {
      '早安祝福': ['朝陽', '雲朵', '鳥兒', '花朵', '金色光芒'],
      '勵志語錄': ['山峰', '飛鳥', '星星', '彩虹', '向上的箭頭'],
      '健康提醒': ['綠葉', '水果', '蔬菜', '心型', '陽光'],
      '溫馨問候': ['愛心', '玫瑰花', '蝴蝶', '柔和光暈', '小熊'],
      '正能量': ['太陽', '笑臉', '彩虹', '氣球', '星星']
    };

    const elements = elementMap[style] || ['花卉', '愛心', '星星'];

    // 根據訊息關鍵字微調
    if (message.includes('健康') || message.includes('養生')) {
      elements.push('綠色植物', '清新感');
    }
    if (message.includes('祝福') || message.includes('好運')) {
      elements.push('四葉草', '金色元素');
    }

    return elements.join('、');
  }

  /**
   * 記錄 API 使用
   */
  private static async logAPIUsage() {
    try {
      await prisma.aPIUsageLog.create({
        data: {
          service: 'elder_meme_generation',
          model: 'gemini-2.5-flash-image + canvas',
          tier: 'paid',
          operation: 'elder_meme_complete',
          cost: 0.005,
          success: true,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  }
}
