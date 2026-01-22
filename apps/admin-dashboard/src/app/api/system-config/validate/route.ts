import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { Client as LineClient } from '@line/bot-sdk';
import { google } from 'googleapis';

/**
 * POST /api/system-config/validate
 * 驗證 API KEY 或配置是否有效
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { type, config } = body;
    
    let result: any = {};
    
    switch (type) {
      case 'line_bot':
        result = await validateLineBotConfig(config);
        break;
      
      case 'gemini_api':
        result = await validateGeminiApiKey(config);
        break;
      
      case 'n8n':
        result = await validateN8nConfig(config);
        break;
      
      case 'google_drive':
        result = await validateGoogleDriveConfig(config);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid validation type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Validation failed' },
      { status: 200 }
    );
  }
}

/**
 * 驗證 Line Bot 配置
 */
async function validateLineBotConfig(config: any): Promise<any> {
  const { channelSecret, channelAccessToken } = config;
  
  if (!channelSecret || !channelAccessToken) {
    return { valid: false, error: 'Missing channel secret or access token' };
  }
  
  try {
    const client = new LineClient({
      channelSecret,
      channelAccessToken
    });
    
    // 測試：取得 Bot 資訊
    const botInfo = await client.getBotInfo();
    
    return {
      valid: true,
      botInfo: {
        displayName: botInfo.displayName,
        userId: botInfo.userId,
        basicId: botInfo.basicId
      }
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid Line Bot credentials'
    };
  }
}

/**
 * 驗證 Gemini API KEY
 */
async function validateGeminiApiKey(config: any): Promise<any> {
  const { apiKey, tier } = config; // tier: 'free' or 'paid'
  
  if (!apiKey) {
    return { valid: false, error: 'Missing API key' };
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 測試：使用 gemini-2.5-flash 生成簡單內容
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say "OK" if you can read this.');
    
    const response = result.response.text();
    
    return {
      valid: true,
      tier,
      testResponse: response,
      message: 'API KEY 驗證成功'
    };
  } catch (error: any) {
    // 判斷錯誤類型
    if (error.message?.includes('API key not valid')) {
      return { valid: false, error: 'API KEY 無效' };
    } else if (error.message?.includes('quota')) {
      return { valid: false, error: 'API 配額已用盡' };
    } else {
      return { valid: false, error: error.message || 'API KEY 驗證失敗' };
    }
  }
}

/**
 * 驗證 n8n 配置
 */
async function validateN8nConfig(config: any): Promise<any> {
  const { apiUrl, apiKey } = config;
  
  if (!apiUrl || !apiKey) {
    return { valid: false, error: 'Missing API URL or API key' };
  }
  
  try {
    // 測試：列出工作流程
    const response = await axios.get(`${apiUrl}/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey
      },
      timeout: 10000
    });
    
    return {
      valid: true,
      workflowCount: response.data.data?.length || 0,
      message: 'n8n 連接成功'
    };
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return { valid: false, error: 'API KEY 無效或無權限' };
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return { valid: false, error: '無法連接到 n8n 服務' };
    } else {
      return { valid: false, error: error.message || 'n8n 連接失敗' };
    }
  }
}

/**
 * 驗證 Google Drive 配置
 */
async function validateGoogleDriveConfig(config: any): Promise<any> {
  const { credentials, folderId } = config;
  
  if (!credentials || !folderId) {
    return { valid: false, error: 'Missing credentials or folder ID' };
  }
  
  try {
    // 解析憑證
    const credentialsObj = typeof credentials === 'string' 
      ? JSON.parse(credentials) 
      : credentials;
    
    // 建立 Google Drive 客戶端
    const auth = new google.auth.GoogleAuth({
      credentials: credentialsObj,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // 測試：取得資料夾資訊
    const folderInfo = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType'
    });
    
    if (folderInfo.data.mimeType !== 'application/vnd.google-apps.folder') {
      return { valid: false, error: '指定的 ID 不是資料夾' };
    }
    
    // 測試：嘗試列出檔案（確認有權限）
    await drive.files.list({
      q: `'${folderId}' in parents`,
      pageSize: 1,
      fields: 'files(id, name)'
    });
    
    return {
      valid: true,
      folderName: folderInfo.data.name,
      message: 'Google Drive 連接成功'
    };
  } catch (error: any) {
    if (error.code === 404) {
      return { valid: false, error: '找不到指定的資料夾' };
    } else if (error.code === 403) {
      return { valid: false, error: '服務帳戶無權限存取此資料夾' };
    } else {
      return { valid: false, error: error.message || 'Google Drive 連接失敗' };
    }
  }
}
