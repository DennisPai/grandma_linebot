import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { middleware } from '@line/bot-sdk';
import { lineConfig } from './config/line.config.js';
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
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'linebot-api'
  });
});

// Line webhook - 使用 Line SDK 的 middleware 進行簽名驗證
app.use('/webhook/line', middleware(lineConfig), webhookRouter);

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
  console.log(`✅ Line Bot API server running on port ${PORT}`);
  console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook/line`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Database connection and initialization
prisma.$connect()
  .then(async () => {
    console.log('✅ Database connected');
    // 初始化預設模型配置
    await ModelConfigService.initializeDefaultConfig();
  })
  .catch((err) => console.error('❌ Database connection failed:', err));
