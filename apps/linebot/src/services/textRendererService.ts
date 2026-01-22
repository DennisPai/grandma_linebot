import { createCanvas, loadImage, registerFont, Canvas, CanvasRenderingContext2D } from 'canvas';
import type { TextLayout, TextLine } from '@grandma-linebot/shared';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TextRendererService {
  private static fontsRegistered = false;

  /**
   * 註冊繁體中文字型
   */
  private static registerFonts() {
    if (this.fontsRegistered) return;

    try {
      const assetsPath = join(__dirname, '../../assets/fonts');
      
      // 註冊思源黑體粗體
      registerFont(join(assetsPath, 'NotoSansTC-Bold.ttf'), {
        family: 'Noto Sans TC',
        weight: 'bold'
      });

      // 註冊思源黑體常規
      registerFont(join(assetsPath, 'NotoSansTC-Regular.ttf'), {
        family: 'Noto Sans TC',
        weight: 'normal'
      });

      this.fontsRegistered = true;
      console.log('✅ Fonts registered successfully');
    } catch (error) {
      console.error('⚠️ Font registration failed, using system fonts:', error);
      // 如果字型註冊失敗，使用系統預設字型
    }
  }

  /**
   * 在圖片上渲染文字（參考 grandpama-bless 的文字渲染技術）
   */
  static async renderTextOnImage(
    backgroundUrl: string,
    textLayout: TextLayout
  ): Promise<Buffer> {
    // 註冊字型
    this.registerFonts();

    try {
      // 載入底圖
      const background = await loadImage(backgroundUrl);
      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext('2d');

      // 繪製底圖
      ctx.drawImage(background, 0, 0);

      // 繪製每一行文字
      for (const line of textLayout.textLines) {
        this.drawTextLine(ctx, line, canvas.width, canvas.height);
      }

      // 返回 JPEG Buffer
      return canvas.toBuffer('image/jpeg', { quality: 0.95 });
    } catch (error: any) {
      console.error('❌ Text rendering failed:', error);
      throw error;
    }
  }

  /**
   * 繪製單行文字
   */
  private static drawTextLine(
    ctx: CanvasRenderingContext2D,
    line: TextLine,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const x = (line.x / 100) * canvasWidth;
    const y = (line.y / 100) * canvasHeight;

    ctx.save();

    // 設定字體
    ctx.font = `${line.fontWeight} ${line.fontSize}px 'Noto Sans TC', ${line.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 旋轉（如果需要）
    if (line.rotation && line.rotation !== 0) {
      ctx.translate(x, y);
      ctx.rotate((line.rotation * Math.PI) / 180);
      ctx.translate(-x, -y);
    }

    // 陰影效果（長輩圖特色）
    if (line.shadowColor) {
      ctx.shadowColor = line.shadowColor;
      ctx.shadowBlur = line.shadowBlur || 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }

    // 描邊（外框）- 長輩圖的核心特徵
    ctx.strokeStyle = line.strokeColor;
    ctx.lineWidth = line.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    
    // 多層描邊效果，增加立體感
    for (let i = line.strokeWidth; i > 0; i -= 2) {
      ctx.lineWidth = i;
      ctx.strokeText(line.text, x, y);
    }

    // 填充文字
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, x, y);

    ctx.restore();
  }

  /**
   * 測試渲染功能
   */
  static async testRender(text: string = '早安 姐姐'): Promise<Buffer> {
    this.registerFonts();

    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // 粉紅漸層背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#FFB6C1');
    gradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // 測試文字
    const testLine: TextLine = {
      text,
      x: 50,
      y: 50,
      fontSize: 80,
      fontWeight: 'bold',
      fontFamily: 'Noto Sans TC',
      color: '#FFFFFF',
      strokeColor: '#FF1493',
      strokeWidth: 8,
      shadowColor: '#000000',
      shadowBlur: 10
    };

    this.drawTextLine(ctx, testLine, 800, 600);

    return canvas.toBuffer('image/jpeg', { quality: 0.95 });
  }
}
