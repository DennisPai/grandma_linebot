/**
 * 共享類型定義
 * 替代 @grandma-linebot/shared 和 @grandma-linebot/rag-engine
 */

// ===== Message 和對話相關類型 =====
export interface Message {
  id?: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  hasImage?: boolean;
  imageUrl?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ===== UserProfile 用戶畫像類型 =====
export interface UserProfile {
  userId: string;
  displayName?: string;
  interests?: string[];
  family?: string;
  health?: string;
  investmentAttitude?: string;
  [key: string]: any; // 允許額外的自定義欄位
}

// ===== 文字渲染相關類型 =====
export interface TextLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor?: string;
  shadowBlur?: number;
  rotation?: number;
}

export interface TextLayout {
  textLines: TextLine[];
}

// ===== RAG 檢索相關類型 =====
export interface RetrievalOptions {
  topK?: number;
  minScore?: number;
}

export interface RetrievalResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

// ===== 圖片生成相關類型 =====
export interface ImageGenerationOptions {
  prompt: string;
  imageType?: 'realistic' | 'elder_meme';
  phoneAngle?: 'selfie' | 'first_person' | 'handheld';
  conversationContext?: string;
}

// ===== AI 對話上下文類型 =====
export interface ConversationContext {
  userMessage: string;
  conversationHistory: Message[];
  userProfile: UserProfile;
}
