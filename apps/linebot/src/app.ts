import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { middleware } from '@line/bot-sdk';
import { middlewareConfig } from './config/line.config.js';
import { prisma } from './config/database.config.js';
import { ModelConfigService } from './config/models.config.js';
import webhookRouter from './controllers/webhookController.js';
import cronRouter from './controllers/cronController.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    // 檢查資料庫連接
    await prisma.$queryRaw`SELECT 1`;
    
    // 檢查 Line 配置是否已從資料庫載入
    const hasLineConfig = process.env.LINE_CHANNEL_SECRET && 
                         process.env.LINE_CHANNEL_SECRET !== 'temp_secret_will_be_loaded_from_db';
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'linebot-api',
      database: 'connected',
      lineConfigured: hasLineConfig,
      message: hasLineConfig ? 'Ready' : 'Waiting for Line configuration via admin dashboard'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'linebot-api',
      error: 'Service unavailable'
    });
  }
});

// Line webhook - 使用 Line SDK 的 middleware 進行簽名驗證
app.use('/webhook/line', middleware(middlewareConfig), webhookRouter);

// Cron endpoints (供 n8n 呼叫)
app.use('/api/cron', cronRouter);

// API endpoints
import messagesRouter from './routes/messages.js';
import usersRouter from './routes/users.js';
import documentsRouter from './routes/documents.js';

app.use('/api/messages', messagesRouter);
app.use('/api/users', usersRouter);
app.use('/api/documents', documentsRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Line Bot API server started successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📍 Webhook: http://localhost:${PORT}/webhook/line`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const hasLineConfig = process.env.LINE_CHANNEL_SECRET && 
                       process.env.LINE_CHANNEL_SECRET !== 'temp_secret_will_be_loaded_from_db';
  
  if (!hasLineConfig) {
    console.log('⚠️  Line credentials not configured');
    console.log('📌 Please configure via admin dashboard:');
    console.log('   1. Access admin dashboard');
    console.log('   2. Go to Settings → Line Bot Configuration');
    console.log('   3. Enter Channel Secret and Access Token');
    console.log('   4. Save configuration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log('✅ Line Bot configured and ready');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
});

// Database connection and initialization
prisma.$connect()
  .then(async () => {
    console.log('✅ Database connected');
    // 初始化預設模型配置
    await ModelConfigService.initializeDefaultConfig();
  })
  .catch((err) => console.error('❌ Database connection failed:', err));
