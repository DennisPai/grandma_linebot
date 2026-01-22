import { prisma } from './database.config.js';
import { decrypt, isEncrypted } from '../utils/encryption.js';

/**
 * 配置載入器
 * 
 * 優先順序：
 * 1. 環境變數（開發環境）
 * 2. 資料庫配置（生產環境）
 * 
 * 特性：
 * - 自動解密加密的配置
 * - 記憶體快取（減少資料庫查詢）
 * - 配置變更時自動刷新快取
 */

interface ConfigCache {
  [key: string]: {
    value: any;
    timestamp: number;
  };
}

class ConfigLoader {
  private cache: ConfigCache = {};
  private cacheTimeout = 5 * 60 * 1000; // 5 分鐘快取
  
  /**
   * 載入配置
   * @param key 配置鍵名
   * @param options 選項
   * @returns 配置值（自動解析 JSON）
   */
  async loadConfig(
    key: string,
    options: { useCache?: boolean; required?: boolean } = {}
  ): Promise<any> {
    const { useCache = true, required = true } = options;
    
    // 1. 檢查快取
    if (useCache && this.cache[key]) {
      const cached = this.cache[key];
      const age = Date.now() - cached.timestamp;
      
      if (age < this.cacheTimeout) {
        console.log(`📦 Config loaded from cache: ${key}`);
        return cached.value;
      }
    }
    
    // 2. 檢查環境變數（優先）
    if (process.env[key]) {
      console.log(`🔧 Config loaded from env: ${key}`);
      const value = this.parseValue(process.env[key]!);
      this.updateCache(key, value);
      return value;
    }
    
    // 3. 從資料庫載入
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });
    
    if (!config) {
      if (required) {
        throw new Error(`❌ Configuration not found: ${key}`);
      }
      console.warn(`⚠️  Configuration not found: ${key}, using null`);
      return null;
    }
    
    console.log(`💾 Config loaded from database: ${key}${config.isEncrypted ? ' (encrypted)' : ''}`);
    
    // 4. 解密（如果需要）
    let value = config.value;
    if (config.isEncrypted && isEncrypted(value)) {
      try {
        value = decrypt(value);
      } catch (error) {
        console.error(`❌ Failed to decrypt config: ${key}`, error);
        throw new Error(`Failed to decrypt configuration: ${key}`);
      }
    }
    
    // 5. 解析 JSON
    const parsedValue = this.parseValue(value);
    this.updateCache(key, parsedValue);
    
    return parsedValue;
  }
  
  /**
   * 載入多個配置
   */
  async loadConfigs(keys: string[]): Promise<{ [key: string]: any }> {
    const results: { [key: string]: any } = {};
    
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.loadConfig(key, { required: false });
      })
    );
    
    return results;
  }
  
  /**
   * 載入系統所有配置
   */
  async loadAllConfigs(): Promise<{ [key: string]: any }> {
    const configs = await prisma.systemConfig.findMany();
    const results: { [key: string]: any } = {};
    
    for (const config of configs) {
      let value = config.value;
      
      if (config.isEncrypted && isEncrypted(value)) {
        try {
          value = decrypt(value);
        } catch (error) {
          console.error(`❌ Failed to decrypt config: ${config.key}`, error);
          continue;
        }
      }
      
      results[config.key] = this.parseValue(value);
    }
    
    this.cache = {};
    for (const [key, value] of Object.entries(results)) {
      this.updateCache(key, value);
    }
    
    return results;
  }
  
  /**
   * 刷新快取
   */
  clearCache(key?: string): void {
    if (key) {
      delete this.cache[key];
      console.log(`🗑️  Cache cleared for: ${key}`);
    } else {
      this.cache = {};
      console.log(`🗑️  All cache cleared`);
    }
  }
  
  /**
   * 解析配置值（自動偵測 JSON）
   */
  private parseValue(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      // 不是 JSON，返回原始字串
      return value;
    }
  }
  
  /**
   * 更新快取
   */
  private updateCache(key: string, value: any): void {
    this.cache[key] = {
      value,
      timestamp: Date.now()
    };
  }
  
  /**
   * 取得快取統計
   */
  getCacheStats(): { keys: string[]; count: number } {
    return {
      keys: Object.keys(this.cache),
      count: Object.keys(this.cache).length
    };
  }
}

// 單例模式
export const configLoader = new ConfigLoader();

/**
 * 便利函數：載入 Line Bot 配置
 */
export async function getLineBotConfig(): Promise<{
  channelSecret: string;
  channelAccessToken: string;
}> {
  const config = await configLoader.loadConfig('line_bot_config', { required: true });
  return {
    channelSecret: config.channelSecret || process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: config.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN
  };
}

/**
 * 便利函數：載入 Gemini API KEYs
 */
export async function getGeminiApiKeys(): Promise<{
  freeApiKey: string;
  paidApiKey: string;
}> {
  const config = await configLoader.loadConfig('gemini_api_keys', { required: false });
  
  return {
    freeApiKey: config?.freeApiKey || process.env.GEMINI_API_KEY_FREE || '',
    paidApiKey: config?.paidApiKey || process.env.GEMINI_API_KEY_PAID || ''
  };
}

/**
 * 便利函數：載入 n8n 配置
 */
export async function getN8nConfig(): Promise<{
  apiUrl: string;
  apiKey: string;
}> {
  const config = await configLoader.loadConfig('n8n_config', { required: false });
  
  return {
    apiUrl: config?.apiUrl || process.env.N8N_API_URL || '',
    apiKey: config?.apiKey || process.env.N8N_API_KEY || ''
  };
}

/**
 * 便利函數：載入 Google Drive 配置
 */
export async function getGoogleDriveConfig(): Promise<{
  enabled: boolean;
  credentials: any;
  folderId: string;
} | null> {
  const enabled = process.env.GOOGLE_DRIVE_ENABLED === 'true';
  
  if (!enabled) {
    return null;
  }
  
  const config = await configLoader.loadConfig('google_drive_config', { required: false });
  
  if (!config && !process.env.GOOGLE_DRIVE_CREDENTIALS) {
    return null;
  }
  
  return {
    enabled: true,
    credentials: config?.credentials || JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || '{}'),
    folderId: config?.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || ''
  };
}

/**
 * 便利函數：載入 AI 模型配置
 */
export async function getAIModelsConfig(): Promise<{
  linebotReplyModel: string;
  aiButlerDefaultModel: string;
  morningMessageModel: string;
  userProfileAnalysisModel: string;
}> {
  const config = await configLoader.loadConfig('ai_models_config', { required: false });
  
  return {
    linebotReplyModel: config?.linebotReplyModel || 'gemini-2.5-flash',
    aiButlerDefaultModel: config?.aiButlerDefaultModel || 'gemini-2.5-pro',
    morningMessageModel: config?.morningMessageModel || 'gemini-2.5-flash',
    userProfileAnalysisModel: config?.userProfileAnalysisModel || 'gemini-2.5-pro'
  };
}
