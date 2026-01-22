import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt, maskApiKey, isEncrypted } from '@/lib/encryption';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

/**
 * GET /api/system-config
 * 獲取所有系統配置（敏感資訊已遮蔽）
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const configs = await prisma.systemConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    
    // 遮蔽敏感資訊
    const maskedConfigs = configs.map((config: any) => {
      let displayValue = config.value;
      
      // 如果是加密的，不顯示原始值
      if (config.isEncrypted) {
        try {
          const decrypted = decrypt(config.value);
          const parsed = JSON.parse(decrypted);
          
          // 遮蔽 API KEYs
          if (parsed.channelSecret) parsed.channelSecret = maskApiKey(parsed.channelSecret);
          if (parsed.channelAccessToken) parsed.channelAccessToken = maskApiKey(parsed.channelAccessToken);
          if (parsed.apiKey) parsed.apiKey = maskApiKey(parsed.apiKey);
          if (parsed.freeApiKey) parsed.freeApiKey = maskApiKey(parsed.freeApiKey);
          if (parsed.paidApiKey) parsed.paidApiKey = maskApiKey(parsed.paidApiKey);
          if (parsed.clientSecret) parsed.clientSecret = maskApiKey(parsed.clientSecret);
          
          displayValue = JSON.stringify(parsed);
        } catch (error) {
          displayValue = '[Encrypted]';
        }
      } else {
        // 非加密配置也可能包含敏感資訊
        try {
          const parsed = JSON.parse(config.value);
          if (typeof parsed === 'object') {
            // 遮蔽可能的敏感欄位
            for (const key of Object.keys(parsed)) {
              if (key.toLowerCase().includes('secret') || 
                  key.toLowerCase().includes('key') ||
                  key.toLowerCase().includes('token')) {
                if (typeof parsed[key] === 'string') {
                  parsed[key] = maskApiKey(parsed[key]);
                }
              }
            }
            displayValue = JSON.stringify(parsed);
          }
        } catch {
          // 不是 JSON，保持原樣
        }
      }
      
      return {
        id: config.id,
        key: config.key,
        value: displayValue,
        description: config.description,
        isEncrypted: config.isEncrypted,
        updatedBy: config.updatedBy,
        updatedAt: config.updatedAt
      };
    });
    
    return NextResponse.json({ configs: maskedConfigs });
  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/system-config
 * 更新系統配置
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { key, value, description, shouldEncrypt = true } = body;
    
    if (!key || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: key and value' },
        { status: 400 }
      );
    }
    
    // 準備儲存的值
    let storedValue = typeof value === 'string' ? value : JSON.stringify(value);
    let isEncryptedValue = false;
    
    // 敏感配置需要加密
    const sensitiveKeys = [
      'line_bot_config',
      'gemini_api_keys',
      'n8n_config',
      'oauth_providers',
      'google_drive_config'
    ];
    
    if (shouldEncrypt && sensitiveKeys.includes(key)) {
      storedValue = encrypt(storedValue);
      isEncryptedValue = true;
    }
    
    // 更新或創建配置
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: storedValue,
        isEncrypted: isEncryptedValue,
        description,
        updatedBy: session.user.email || session.user.name,
        updatedAt: new Date()
      },
      create: {
        key,
        value: storedValue,
        isEncrypted: isEncryptedValue,
        description,
        updatedBy: session.user.email || session.user.name
      }
    });
    
    console.log(`✅ Config updated: ${key} (encrypted: ${isEncryptedValue})`);
    
    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        key: config.key,
        description: config.description,
        isEncrypted: config.isEncrypted
      }
    });
  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json(
      { error: 'Failed to update system config' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/system-config?key=xxx
 * 刪除配置
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }
    
    await prisma.systemConfig.delete({
      where: { key }
    });
    
    console.log(`🗑️  Config deleted: ${key}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting system config:', error);
    return NextResponse.json(
      { error: 'Failed to delete system config' },
      { status: 500 }
    );
  }
}
