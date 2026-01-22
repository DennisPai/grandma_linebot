export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PendingMessage {
  id: number;
  userId: string;
  messageType: 'morning' | 'reply' | 'proactive';
  content: string;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  approvedBy?: string;
  reviewedAt?: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

export interface ImageGenerationOptions {
  prompt: string;
  imageType: 'realistic_photo' | 'elder_meme';
  conversationContext?: string;
  phoneAngle?: 'selfie' | 'first_person' | 'handheld';
}

export interface TextLayout {
  textLines: TextLine[];
  reasoning: string;
}

export interface TextLine {
  text: string;
  x: number; // 百分比位置 0-100
  y: number; // 百分比位置 0-100
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  rotation?: number;
  shadowColor?: string;
  shadowBlur?: number;
}
