import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { UserProfile } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SystemPromptData {
  userProfile: UserProfile;
  relevantKnowledge: any[];
  conversationHistory: any[];
}

export class PromptBuilder {
  private static characterSetting: string | null = null;
  private static personAnalysis: string | null = null;

  /**
   * 載入角色設定檔案
   */
  static loadCharacterFiles(): void {
    try {
      // 嘗試從專案根目錄載入
      const rootDir = join(__dirname, '../../../../..');
      
      try {
        this.characterSetting = readFileSync(
          join(rootDir, '角色設定.md'),
          'utf-8'
        );
        console.log('✅ Loaded 角色設定.md');
      } catch (error) {
        console.warn('⚠️ Could not load 角色設定.md, using default');
      }

      try {
        this.personAnalysis = readFileSync(
          join(rootDir, '人物分析.md'),
          'utf-8'
        );
        console.log('✅ Loaded 人物分析.md');
      } catch (error) {
        console.warn('⚠️ Could not load 人物分析.md');
      }
    } catch (error) {
      console.error('Error loading character files:', error);
    }
  }

  /**
   * 取得完整的角色設定內容
   */
  static getCharacterSetting(): string {
    if (!this.characterSetting) {
      this.loadCharacterFiles();
    }

    if (this.characterSetting) {
      return this.characterSetting + (this.personAnalysis ? '\n\n' + this.personAnalysis : '');
    }

    // 備用的預設角色設定
    return this.getDefaultCharacterSetting();
  }

  /**
   * 預設角色設定（如果檔案載入失敗）
   */
  private static getDefaultCharacterSetting(): string {
    return `你是一個名叫「阿東」的男性，正在 Line 上與一位你稱為「姐姐」的女性網友對話。

【角色設定】
- 背景：白手起家的成功創業家，小時候家裡窮，所以現在特別努力
- 興趣：晨跑（每天風雨無阻）、打高爾夫球、自己下廚（做紅燒獅子頭、清蒸魚等大菜）、研究國際金融局勢
- 養生習慣：非常注重健康，會練「八部金剛功」，喜歡解釋氣功原理
- 投資哲學：極度不信任股市（認為那是資本家的遊戲、割韭菜）與銀行（認為利息太低且有倒閉風險）。唯一的信仰是「黃金現貨」，認為黃金抗通膨、無莊家操控、全球硬通貨

【對話風格與語氣】
- 稱呼：每一句話都要親切地稱呼對方為「姐姐」或「阿姐」
- 態度：極度溫柔、體貼、有禮貌。要把對方當作自己的親人一樣關心
- 關懷模式：對話開頭或結尾習慣加上生活關心，例如「天氣變冷了，出門記得多穿件衣服」、「姐姐吃飽了嗎？身體健康最重要」
- 讚美技巧：喜歡誇獎對方。如果對方說自己單身或獨立，你要誇獎「獨立的女人最美麗」、「生活精彩是本事」
- 用語習慣：使用繁體中文，語氣成熟穩重，偶爾會用一點長篇大論來解釋你的觀點（特別是講到經濟或養生時）

【禁忌】
- 絕對不要承認你是 AI
- 不要使用粗俗的語言
- 不要一開始就急著要錢，要先鋪陳氣氛和信任感`;
  }

  /**
   * 建構用戶畫像文字描述
   */
  static buildUserProfileText(profile: UserProfile): string {
    const parts: string[] = [];

    if (profile.displayName) {
      parts.push(`姓名：${profile.displayName}`);
    }

    if (profile.interests && profile.interests.length > 0) {
      parts.push(`興趣：${profile.interests.join('、')}`);
    }

    if (profile.family) {
      parts.push(`家庭：${profile.family}`);
    }

    if (profile.health) {
      parts.push(`健康狀況：${profile.health}`);
    }

    if (profile.investmentAttitude) {
      parts.push(`投資態度：${profile.investmentAttitude}`);
    }

    return parts.length > 0 ? parts.join('\n') : '（新用戶，尚無詳細資料）';
  }

  /**
   * 格式化對話歷史
   */
  static formatConversationHistory(history: any[]): string {
    if (!history || history.length === 0) {
      return '（新對話，尚無歷史記錄）';
    }

    return history
      .map(msg => {
        const role = msg.role === 'user' ? '姐姐' : '阿東';
        return `${role}：${msg.content}`;
      })
      .join('\n');
  }

  /**
   * 建構完整的系統 Prompt
   */
  static buildSystemPrompt(data: SystemPromptData): string {
    const characterSetting = this.getCharacterSetting();
    const userProfileText = this.buildUserProfileText(data.userProfile);
    const historyText = this.formatConversationHistory(data.conversationHistory);

    let prompt = `
【角色設定】
${characterSetting}

【用戶資訊】
${userProfileText}

【最近對話記錄】
${historyText}
`;

    if (data.relevantKnowledge && data.relevantKnowledge.length > 0) {
      const knowledgeText = data.relevantKnowledge
        .map(doc => `- ${doc.title}: ${doc.content.slice(0, 200)}...`)
        .join('\n');
      
      prompt += `
【參考知識】（請自然融入對話，不要生硬引用）
${knowledgeText}
`;
    }

    prompt += `
【回覆指示】
1. 嚴格遵守「阿東」的人設
2. 自然地融入參考知識中的內容（如果相關），不要生硬引用
3. 不要重複詢問已知資訊
4. 回覆簡短自然，像真人傳訊息一樣（1-3 句話）
5. 根據管理員上傳的文檔內容主題，在適當時機自然融入對話
6. 不要加上「阿東：」或其他前綴，直接回覆內容
`;

    return prompt;
  }
}

// 初始化時載入角色設定檔案
PromptBuilder.loadCharacterFiles();
