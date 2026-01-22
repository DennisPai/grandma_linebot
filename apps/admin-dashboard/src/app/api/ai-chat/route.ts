import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 獲取選擇的模型（從 header 或使用預設）
    const selectedModel = req.headers.get('x-ai-model') || 'gemini-2.5-pro';

    // 分析問題類型並收集相關資料
    const context = await buildContext(message);

    // 呼叫 Gemini AI
    const apiKey = selectedModel.includes('pro-preview')
      ? process.env.GEMINI_API_KEY_PAID
      : process.env.GEMINI_API_KEY_FREE;

    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: buildSystemInstruction(context)
    });

    // 建立或繼續對話
    const chat = model.startChat({
      history: conversationHistory || []
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({
      response,
      modelUsed: selectedModel,
      context: {
        hasUserData: context.users.length > 0,
        hasStats: !!context.stats,
        hasDocuments: context.documents.length > 0
      }
    });

  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: error.message },
      { status: 500 }
    );
  }
}

async function buildContext(message: string) {
  const context: any = {
    users: [],
    stats: null,
    documents: []
  };

  // 簡單的問題類型判斷
  const messageLower = message.toLowerCase();

  // 如果詢問用戶相關
  if (messageLower.includes('用戶') || messageLower.includes('姐姐') || messageLower.includes('誰')) {
    context.users = await prisma.user.findMany({
      take: 10,
      orderBy: { lastActiveAt: 'desc' },
      include: {
        _count: {
          select: { conversations: true }
        }
      }
    });
  }

  // 如果詢問統計相關
  if (messageLower.includes('統計') || messageLower.includes('數量') || messageLower.includes('多少')) {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    context.stats = {
      totalUsers: await prisma.user.count(),
      activeUsers: await prisma.user.count({
        where: { lastActiveAt: { gte: last7Days } }
      }),
      totalConversations: await prisma.conversation.count(),
      recentConversations: await prisma.conversation.count({
        where: { timestamp: { gte: last7Days } }
      }),
      pendingMessages: await prisma.pendingMessage.count({
        where: { status: 'pending' }
      })
    };
  }

  // 如果詢問文檔相關
  if (messageLower.includes('文檔') || messageLower.includes('知識')) {
    context.documents = await prisma.document.findMany({
      take: 10,
      orderBy: { referenceCount: 'desc' }
    });
  }

  return context;
}

function buildSystemInstruction(context: any): string {
  let instruction = `
你是一個後台管理系統的 AI 管家助手，你的職責是幫助管理員（晚輩）快速了解 Line Bot「阿東」與長輩用戶的互動情況。

你可以：
1. 分析用戶對話內容，提供洞察
2. 識別需要關注的用戶（如情緒低落、長時間未互動）
3. 建議對話策略和內容調整
4. 生成統計報告和趨勢分析

回答時請：
- 用繁體中文
- 清晰且有條理
- 提供具體的數據和建議
- 如果需要更多資訊，明確說明
`;

  if (context.users.length > 0) {
    instruction += `\n【用戶資料】\n${JSON.stringify(context.users, null, 2)}`;
  }

  if (context.stats) {
    instruction += `\n【系統統計】\n${JSON.stringify(context.stats, null, 2)}`;
  }

  if (context.documents.length > 0) {
    instruction += `\n【知識庫文檔】\n${JSON.stringify(context.documents.map((d: any) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      referenceCount: d.referenceCount
    })), null, 2)}`;
  }

  return instruction;
}
