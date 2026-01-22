import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/n8n/deploy
 * 部署 n8n 工作流程到 n8n 平台
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { deployAll = true, workflowNames = [] } = body;
    
    // 從配置載入 n8n 設定
    const n8nConfig = await getN8nConfigFromDb();
    
    if (!n8nConfig?.apiUrl || !n8nConfig?.apiKey) {
      return NextResponse.json(
        { error: '請先在系統設定中配置 n8n API URL 和 API KEY' },
        { status: 400 }
      );
    }
    
    const { apiUrl, apiKey } = n8nConfig;
    
    // 載入工作流程定義檔案
    const workflowsDir = path.join(process.cwd(), '../../apps/n8n-workflows/workflows');
    const workflowFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.json'));
    
    const results = [];
    const errors = [];
    
    for (const file of workflowFiles) {
      const workflowName = file.replace('.json', '');
      
      // 如果指定了特定工作流程，跳過不在列表中的
      if (!deployAll && !workflowNames.includes(workflowName)) {
        continue;
      }
      
      try {
        const filePath = path.join(workflowsDir, file);
        const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // 檢查工作流程是否已存在
        const existingWorkflows = await axios.get(`${apiUrl}/workflows`, {
          headers: { 'X-N8N-API-KEY': apiKey },
          timeout: 10000
        });
        
        const existing = existingWorkflows.data.data?.find(
          (w: any) => w.name === workflowData.name
        );
        
        if (existing) {
          // 更新現有工作流程
          const updateResponse = await axios.patch(
            `${apiUrl}/workflows/${existing.id}`,
            workflowData,
            {
              headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          
          results.push({
            name: workflowData.name,
            action: 'updated',
            id: existing.id,
            success: true
          });
          
          console.log(`✅ 工作流程已更新: ${workflowData.name} (ID: ${existing.id})`);
        } else {
          // 建立新工作流程
          const createResponse = await axios.post(
            `${apiUrl}/workflows`,
            workflowData,
            {
              headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          
          results.push({
            name: workflowData.name,
            action: 'created',
            id: createResponse.data.id,
            success: true
          });
          
          console.log(`✅ 工作流程已建立: ${workflowData.name} (ID: ${createResponse.data.id})`);
        }
        
        // 確保工作流程已啟用
        if (existing) {
          await axios.patch(
            `${apiUrl}/workflows/${existing.id}`,
            { active: true },
            {
              headers: { 'X-N8N-API-KEY': apiKey },
              timeout: 10000
            }
          );
        }
        
      } catch (error: any) {
        console.error(`❌ 部署工作流程失敗: ${workflowName}`, error);
        errors.push({
          name: workflowName,
          error: error.message || '部署失敗'
        });
      }
    }
    
    return NextResponse.json({
      success: errors.length === 0,
      deployed: results,
      errors,
      summary: {
        total: results.length + errors.length,
        success: results.length,
        failed: errors.length
      }
    });
    
  } catch (error: any) {
    console.error('Error deploying n8n workflows:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deploy workflows' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/n8n/deploy/workflows
 * 獲取已部署的工作流程列表
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const n8nConfig = await getN8nConfigFromDb();
    
    if (!n8nConfig?.apiUrl || !n8nConfig?.apiKey) {
      return NextResponse.json(
        { error: '請先在系統設定中配置 n8n' },
        { status: 400 }
      );
    }
    
    const { apiUrl, apiKey } = n8nConfig;
    
    // 獲取所有工作流程
    const response = await axios.get(`${apiUrl}/workflows`, {
      headers: { 'X-N8N-API-KEY': apiKey },
      timeout: 10000
    });
    
    const workflows = response.data.data || [];
    
    // 獲取每個工作流程的執行狀態
    const workflowsWithStatus = await Promise.all(
      workflows.map(async (workflow: any) => {
        try {
          // 獲取最近的執行記錄
          const executions = await axios.get(
            `${apiUrl}/executions`,
            {
              headers: { 'X-N8N-API-KEY': apiKey },
              params: {
                workflowId: workflow.id,
                limit: 1
              },
              timeout: 5000
            }
          );
          
          const lastExecution = executions.data.data?.[0];
          
          return {
            id: workflow.id,
            name: workflow.name,
            active: workflow.active,
            lastExecution: lastExecution ? {
              startedAt: lastExecution.startedAt,
              stoppedAt: lastExecution.stoppedAt,
              status: lastExecution.status,
              mode: lastExecution.mode
            } : null
          };
        } catch (error) {
          return {
            id: workflow.id,
            name: workflow.name,
            active: workflow.active,
            lastExecution: null
          };
        }
      })
    );
    
    return NextResponse.json({
      workflows: workflowsWithStatus,
      total: workflowsWithStatus.length
    });
    
  } catch (error: any) {
    console.error('Error fetching n8n workflows:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workflows' },
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
      // 嘗試從環境變數載入
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
