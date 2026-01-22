import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import axios from 'axios';

/**
 * GET /api/n8n/status
 * 檢查 n8n 連接狀態
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const n8nConfig = await getN8nConfigFromDb();
    
    if (!n8nConfig?.apiUrl || !n8nConfig?.apiKey) {
      return NextResponse.json({
        connected: false,
        configured: false,
        message: '請先在系統設定中配置 n8n API'
      });
    }
    
    const { apiUrl, apiKey } = n8nConfig;
    
    try {
      // 測試連接：獲取工作流程列表
      const response = await axios.get(`${apiUrl}/workflows`, {
        headers: { 'X-N8N-API-KEY': apiKey },
        timeout: 5000
      });
      
      const workflowCount = response.data.data?.length || 0;
      
      // 獲取活躍的工作流程數量
      const activeWorkflows = response.data.data?.filter((w: any) => w.active) || [];
      
      return NextResponse.json({
        connected: true,
        configured: true,
        apiUrl,
        workflowCount,
        activeWorkflowCount: activeWorkflows.length,
        message: 'n8n 連接正常'
      });
      
    } catch (error: any) {
      return NextResponse.json({
        connected: false,
        configured: true,
        apiUrl,
        error: error.message || '無法連接到 n8n',
        message: 'n8n 連接失敗'
      });
    }
    
  } catch (error: any) {
    console.error('Error checking n8n status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check n8n status' },
      { status: 500 }
    );
  }
}

/**
 * 從資料庫載入 n8n 配置
 */
async function getN8nConfigFromDb(): Promise<{ apiUrl: string; apiKey: string } | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { decrypt, isEncrypted } = await import('@/lib/encryption');
    
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'n8n_config' }
    });
    
    if (!config) {
      if (process.env.N8N_API_URL && process.env.N8N_API_KEY) {
        return {
          apiUrl: process.env.N8N_API_URL,
          apiKey: process.env.N8N_API_KEY
        };
      }
      return null;
    }
    
    let value = config.value;
    if (config.isEncrypted && isEncrypted(value)) {
      value = decrypt(value);
    }
    
    const parsed = JSON.parse(value);
    return {
      apiUrl: parsed.apiUrl || process.env.N8N_API_URL || '',
      apiKey: parsed.apiKey || process.env.N8N_API_KEY || ''
    };
  } catch (error) {
    console.error('Failed to load n8n config:', error);
    return null;
  }
}
