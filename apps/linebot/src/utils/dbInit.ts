/**
 * 資料庫初始化工具
 * 確保所有必要的表都已創建
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function initializeDatabase(): Promise<void> {
  console.log('🔄 Initializing database schema...');
  
  try {
    // 使用 prisma db push 創建所有表結構
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate');
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr && !stderr.includes('already in sync')) {
      console.warn('⚠️ Prisma warnings:', stderr);
    }
    
    console.log('✅ Database schema initialized successfully');
  } catch (error: any) {
    // 檢查是否是「已經同步」的錯誤（這是正常的）
    if (error.message && error.message.includes('already in sync')) {
      console.log('✅ Database schema is already up to date');
      return;
    }
    
    console.error('❌ Failed to initialize database schema:', error.message);
    throw error;
  }
}
