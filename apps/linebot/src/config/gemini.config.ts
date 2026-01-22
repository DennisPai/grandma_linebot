import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiModelConfig {
  name: string;
  displayName: string;
  tier: 'free' | 'paid';
  apiKey: string;
  features: string[];
  costPerMillion: number; // 每百萬 tokens 成本（美元）
}

export const GEMINI_MODELS: GeminiModelConfig[] = [
  {
    name: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash Preview',
    tier: 'free',
    apiKey: process.env.GEMINI_API_KEY_FREE || '',
    features: ['最新預覽版', '快速回應', '適合一般對話'],
    costPerMillion: 0
  },
  {
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    tier: 'free',
    apiKey: process.env.GEMINI_API_KEY_FREE || '',
    features: ['進階分析', '長文本處理', '適合 AI 管家'],
    costPerMillion: 0
  },
  {
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    tier: 'free',
    apiKey: process.env.GEMINI_API_KEY_FREE || '',
    features: ['最快回應', '低延遲', '適合 Line Bot 回覆'],
    costPerMillion: 0
  },
  {
    name: 'gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro Preview',
    tier: 'paid',
    apiKey: process.env.GEMINI_API_KEY_PAID || '',
    features: ['最強能力', '複雜推理', '適合高級分析'],
    costPerMillion: 10.0
  },
  {
    name: 'gemini-3-pro-image-preview',
    displayName: 'Gemini 3 Pro Image (Banana Pro)',
    tier: 'paid',
    apiKey: process.env.GEMINI_API_KEY_PAID || '',
    features: ['圖片生成', '場景描述', '專用於 Banana Pro 寫實照片'],
    costPerMillion: 15.0
  },
  {
    name: 'gemini-2.5-flash-image',
    displayName: 'Gemini 2.5 Flash Image',
    tier: 'paid',
    apiKey: process.env.GEMINI_API_KEY_PAID || '',
    features: ['快速圖片生成', '專用於長輩圖底圖生成'],
    costPerMillion: 5.0
  }
];

export function getModelConfig(modelName: string): GeminiModelConfig {
  const config = GEMINI_MODELS.find(m => m.name === modelName);
  if (!config) {
    console.warn(`Model ${modelName} not found, using default gemini-2.5-flash`);
    return GEMINI_MODELS.find(m => m.name === 'gemini-2.5-flash')!;
  }
  return config;
}

export function getGeminiClient(modelName: string): GoogleGenerativeAI {
  const config = getModelConfig(modelName);
  return new GoogleGenerativeAI(config.apiKey);
}

export function getGeminiAPIKey(modelName: string): string {
  const config = getModelConfig(modelName);
  return config.apiKey;
}
