import { prisma } from '../config/database.config.js';
import crypto from 'crypto';

/**
 * 增強的結構化日誌系統
 * 
 * 特性：
 * - 結構化日誌（包含 traceId, userId, service 等）
 * - 多種日誌等級（DEBUG, INFO, WARN, ERROR, FATAL）
 * - 自動記錄重要日誌到資料庫
 * - 支援日誌元數據（metadata）
 * - 錯誤堆疊追蹤
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogMetadata {
  userId?: string;
  traceId?: string;
  service?: string;
  action?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;
  private service: string;
  private enableDatabaseLogging: boolean;
  
  constructor(serviceName: string = 'linebot') {
    const envLevel = process.env.LOG_LEVEL || 'INFO';
    this.logLevel = LogLevel[envLevel as keyof typeof LogLevel] || LogLevel.INFO;
    this.service = serviceName;
    this.enableDatabaseLogging = process.env.DB_LOGGING_ENABLED !== 'false';
  }
  
  /**
   * 判斷是否應該記錄此等級的日誌
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }
  
  /**
   * 判斷是否應該記錄到資料庫（只記錄 WARN 以上等級）
   */
  private shouldLogToDatabase(level: LogLevel): boolean {
    if (!this.enableDatabaseLogging) return false;
    return [LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL].includes(level);
  }
  
  /**
   * 格式化控制台輸出
   */
  private formatConsoleMessage(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): string {
    const timestamp = new Date().toISOString();
    const traceId = metadata?.traceId ? ` [${metadata.traceId.substring(0, 8)}]` : '';
    const userId = metadata?.userId ? ` [user:${metadata.userId}]` : '';
    const service = ` [${metadata?.service || this.service}]`;
    
    // 顏色編碼
    const levelColors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    };
    const reset = '\x1b[0m';
    const color = levelColors[level];
    
    let output = `${timestamp}${service}${traceId}${userId} ${color}[${level}]${reset} ${message}`;
    
    // 附加元數據（排除已顯示的欄位）
    if (metadata) {
      const { userId, traceId, service, ...rest } = metadata;
      if (Object.keys(rest).length > 0) {
        output += ` ${JSON.stringify(rest)}`;
      }
    }
    
    return output;
  }
  
  /**
   * 記錄到資料庫
   */
  private async logToDatabase(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLogToDatabase(level)) {
      return;
    }
    
    try {
      await prisma.systemLog.create({
        data: {
          level,
          service: metadata?.service || this.service,
          message,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
          traceId: metadata?.traceId,
          userId: metadata?.userId,
          stackTrace: error?.stack || null,
          timestamp: new Date()
        }
      });
    } catch (dbError) {
      // 資料庫記錄失敗不應影響主程序
      console.error('Failed to log to database:', dbError);
    }
  }
  
  /**
   * DEBUG 等級日誌
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatConsoleMessage(LogLevel.DEBUG, message, metadata));
    }
  }
  
  /**
   * INFO 等級日誌
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatConsoleMessage(LogLevel.INFO, message, metadata));
    }
  }
  
  /**
   * WARN 等級日誌（會記錄到資料庫）
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatConsoleMessage(LogLevel.WARN, message, metadata));
      this.logToDatabase(LogLevel.WARN, message, metadata).catch(() => {});
    }
  }
  
  /**
   * ERROR 等級日誌（會記錄到資料庫）
   */
  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorMeta = {
        ...metadata,
        errorMessage: errorObj.message,
        errorName: errorObj.name
      };
      
      console.error(this.formatConsoleMessage(LogLevel.ERROR, message, errorMeta));
      console.error(errorObj.stack);
      
      this.logToDatabase(LogLevel.ERROR, message, errorMeta, errorObj).catch(() => {});
    }
  }
  
  /**
   * FATAL 等級日誌（嚴重錯誤，會記錄到資料庫）
   */
  fatal(message: string, error?: Error | any, metadata?: LogMetadata): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMeta = {
      ...metadata,
      errorMessage: errorObj.message,
      errorName: errorObj.name
    };
    
    console.error(this.formatConsoleMessage(LogLevel.FATAL, message, errorMeta));
    console.error(errorObj.stack);
    
    this.logToDatabase(LogLevel.FATAL, message, errorMeta, errorObj).catch(() => {});
  }
  
  /**
   * 建立子 Logger（帶有固定的 metadata）
   */
  child(metadata: LogMetadata): ChildLogger {
    return new ChildLogger(this, metadata);
  }
  
  /**
   * 生成追蹤 ID
   */
  static generateTraceId(): string {
    return crypto.randomUUID();
  }
  
  /**
   * 計時器：記錄操作執行時間
   */
  startTimer(operation: string, metadata?: LogMetadata): () => void {
    const startTime = Date.now();
    const traceId = metadata?.traceId || Logger.generateTraceId();
    
    this.debug(`Starting: ${operation}`, { ...metadata, traceId });
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed: ${operation}`, {
        ...metadata,
        traceId,
        duration,
        durationMs: duration
      });
    };
  }
}

/**
 * 子 Logger（繼承父 Logger 的 metadata）
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private baseMetadata: LogMetadata
  ) {}
  
  private mergeMetadata(metadata?: LogMetadata): LogMetadata {
    return { ...this.baseMetadata, ...metadata };
  }
  
  debug(message: string, metadata?: LogMetadata): void {
    this.parent.debug(message, this.mergeMetadata(metadata));
  }
  
  info(message: string, metadata?: LogMetadata): void {
    this.parent.info(message, this.mergeMetadata(metadata));
  }
  
  warn(message: string, metadata?: LogMetadata): void {
    this.parent.warn(message, this.mergeMetadata(metadata));
  }
  
  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    this.parent.error(message, error, this.mergeMetadata(metadata));
  }
  
  fatal(message: string, error?: Error | any, metadata?: LogMetadata): void {
    this.parent.fatal(message, error, this.mergeMetadata(metadata));
  }
  
  startTimer(operation: string, metadata?: LogMetadata): () => void {
    return this.parent.startTimer(operation, this.mergeMetadata(metadata));
  }
}

// 預設 Logger 實例
export const logger = new Logger('linebot');

// 建立專用 Logger
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}

// 導出 Logger 類以便訪問靜態方法
export { Logger };
