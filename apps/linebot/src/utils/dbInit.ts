/**
 * 資料庫初始化工具
 * 確保所有必要的表都已創建
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '../config/database.config.js';

const execAsync = promisify(exec);

export async function initializeDatabase(): Promise<void> {
  console.log('🔄 Initializing database schema...');
  
  try {
    // 步驟 1：創建 linebot schema（如果不存在）
    try {
      await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS linebot;');
      console.log('✅ Schema "linebot" ensured');
    } catch (schemaError) {
      console.warn('⚠️ Schema creation warning (may already exist):', schemaError);
    }
    
    // 步驟 2：使用 prisma db push 創建所有表結構
    const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate');
    
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
