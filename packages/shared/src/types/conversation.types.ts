export interface Message {
  id: number;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  hasImage: boolean;
  imageUrl?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  interests?: string[];
  family?: string;
  health?: string;
  investmentAttitude?: string;
  [key: string]: any;
}

export interface ConversationContext {
  userMessage: string;
  conversationHistory: Message[];
  userProfile: UserProfile;
  relevantDocuments?: Document[];
}
