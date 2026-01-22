import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { decrypt, isEncrypted } from '@/lib/encryption';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { Client as LineClient } from '@line/bot-sdk';

/**
 * GET /api/system-config/health
 * 檢查所有服務的健康狀態
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const healthChecks = await Promise.allSettled([
      checkDatabase(),
      checkLineBotApi(),
      checkGeminiApiFree(),
      checkGeminiApiPaid(),
      checkN8nApi(),
      checkGoogleDrive()
    ]);
    
    const results = {
      database: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : { healthy: false, error: 'Check failed' },
      lineBotApi: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : { healthy: false, error: 'Check failed' },
      geminiApiFree: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : { healthy: false, error: 'Check failed' },
      geminiApiPaid: healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : { healthy: false, error: 'Check failed' },
      n8nApi: healthChecks[4].status === 'fulfilled' ? healthChecks[4].value : { healthy: false, error: 'Check failed' },
      googleDrive: healthChecks[5].status === 'fulfilled' ? healthChecks[5].value : { healthy: false, error: 'Check failed' }
    };
    
    const overallHealthy = Object.values(results).every(r => r.healthy);
    
    return NextResponse.json({
      healthy: overallHealthy,
      services: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error performing health check:', error);
    return NextResponse.json(
      { error: error.message || 'Health check failed' },
      { status: 500 }
    );
  }
}

/**
 * 檢查資料庫連接
 */
async function checkDatabase(): Promise<{ healthy: boolean; message?: string; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    
    return {
      healthy: true,
      message: `資料庫連接正常 (${userCount} 位用戶)`
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || '資料庫連接失敗'
    };
  }
}

/**
 * 檢查 Line Bot API
 */
async function checkLineBotApi(): Promise<{ healthy: boolean; message?: string; error?: string }> {
  try {
    const config = await getConfigFromDb('line_bot_config');
    
    if (!config?.channelSecret || !config?.channelAccessToken) {
      return {
        healthy: false,
        error: '未配置 Line Bot'
      };
    }
    
    const client = new LineClient({
      channelSecret: config.channelSecret,
      channelAccessToken: config.channelAccessToken
    });
    
    const botInfo = await client.getBotInfo();
    
    return {
      healthy: true,
      message: `Line Bot 正常 (${botInfo.displayName})`
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || 'Line Bot API 錯誤'
    };
  }
}

/**
 * 檢查 Gemini API（免費版）
 */
async function checkGeminiApiFree(): Promise<{ healthy: boolean; message?: string; error?: string }> {
  try {
    const config = await getConfigFromDb('gemini_api_keys');
    const apiKey = config?.freeApiKey || process.env.GEMINI_API_KEY_FREE;
    
    if (!apiKey) {
      return {
        healthy: false,
        error: '未配置免費版 Gemini API KEY'
      };
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    await model.generateContent('test');
    
    return {
      healthy: true,
      message: 'Gemini API (免費版) 正常'
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || 'Gemini API (免費版) 錯誤'
    };
  }
}

/**
 * 檢查 Gemini API（付費版）
 */
async function checkGeminiApiPaid(): Promise<{ healthy: boolean; message?: string; error?: string }> {
  try {
    const config = await getConfigFromDb('gemini_api_keys');
    const apiKey = config?.paidApiKey || process.env.GEMINI_API_KEY_PAID;
    
    if (!apiKey) {
      return {
        healthy: false,
        error: '未配置付費版 Gemini API KEY'
      };
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    await model.generateContent('test');
    
    return {
      healthy: true,
      message: 'Gemini API (付費版) 正常'
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || 'Gemini API (付費版) 錯誤'
    };
  }
}

/**
 * 檢查 n8n API
 */
async function checkN8nApi(): Promise<{ healthy: boolean; message?: string; error?: string }> {
  try {
    const config = await getConfigFromDb('n8n_config');
    
    if (!config?.apiUrl || !config?.apiKey) {
      return {
        healthy: false,
        error: '未配置 n8n API'
      };
    }
    
    const response = await axios.get(`${config.apiUrl}/workflows`, {
      headers: { 'X-N8N-API-KEY': config.apiKey },
      timeout: 5000
    });
    
    const workflowCount = response.data.data?.length || 0;
    
    return {
      healthy: true,
      message: `n8n 正常 (${workflowCount} 個工作流程)`
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || 'n8n API 錯誤'
    };
  }
}

/**
 * 檢查 Google Drive
 */
async function checkGoogleDrive(): Promise<{ healthy: boolean; message?: string; error?: string }> {
  try {
    const config = await getConfigFromDb('google_drive_config');
    
    if (!config?.enabled) {
      return {
        healthy: true,
        message: 'Google Drive 未啟用（可選功能）'
      };
    }
    
    if (!config?.credentials || !config?.folderId) {
      return {
        healthy: false,
        error: '未完整配置 Google Drive'
      };
    }
    
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: config.credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    await drive.files.get({
      fileId: config.folderId,
      fields: 'id, name'
    });
    
    return {
      healthy: true,
      message: 'Google Drive 正常'
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || 'Google Drive 錯誤'
    };
  }
}

/**
 * 從資料庫載入配置
 */
async function getConfigFromDb(key: string): Promise<any> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });
    
    if (!config) {
      return null;
    }
    
    let value = config.value;
    if (config.isEncrypted && isEncrypted(value)) {
      value = decrypt(value);
    }
    
    return JSON.parse(value);
  } catch (error) {
    console.error(`Failed to load config: ${key}`, error);
    return null;
  }
}
