import crypto from 'crypto';

/**
 * 配置加密/解密工具
 * 用於保護儲存在資料庫中的敏感資訊
 */

// 加密演算法
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * 從環境變數或生成加密金鑰
 * 在生產環境中，ENCRYPTION_KEY 應設定在 Zeabur 環境變數
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (envKey) {
    // 確保金鑰長度正確
    return crypto.scryptSync(envKey, 'salt', KEY_LENGTH);
  }
  
  // 開發環境：使用預設金鑰（不安全，僅供開發）
  console.warn('⚠️  ENCRYPTION_KEY not set, using default key (NOT SECURE FOR PRODUCTION)');
  return crypto.scryptSync('default-dev-key-change-in-production', 'salt', KEY_LENGTH);
}

/**
 * 加密敏感資料
 * @param text 要加密的文字
 * @returns 加密後的字串（Base64 編碼）
 */
export function encrypt(text: string): string {
  try {
    // 生成隨機鹽值和 IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // 從鹽值衍生金鑰
    const key = crypto.scryptSync(getEncryptionKey(), salt, KEY_LENGTH);
    
    // 建立加密器
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // 加密資料
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    // 取得驗證標籤
    const tag = cipher.getAuthTag();
    
    // 組合：salt + iv + tag + encrypted
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    
    // 轉為 Base64
    return result.toString('base64');
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 解密敏感資料
 * @param encryptedText 加密的文字（Base64 編碼）
 * @returns 解密後的原始文字
 */
export function decrypt(encryptedText: string): string {
  try {
    // 從 Base64 解碼
    const buffer = Buffer.from(encryptedText, 'base64');
    
    // 提取各個部分
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = buffer.subarray(ENCRYPTED_POSITION);
    
    // 從鹽值衍生金鑰
    const key = crypto.scryptSync(getEncryptionKey(), salt, KEY_LENGTH);
    
    // 建立解密器
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // 解密資料
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * 遮蔽 API KEY 顯示
 * 只顯示前 8 個和後 4 個字元
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return '***';
  }
  
  const start = apiKey.substring(0, 8);
  const end = apiKey.substring(apiKey.length - 4);
  const masked = '*'.repeat(Math.min(apiKey.length - 12, 20));
  
  return `${start}${masked}${end}`;
}

/**
 * 驗證字串是否已加密
 */
export function isEncrypted(text: string): boolean {
  try {
    // 嘗試從 Base64 解碼
    const buffer = Buffer.from(text, 'base64');
    
    // 檢查長度是否合理（至少包含 salt + iv + tag）
    return buffer.length >= (SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  } catch {
    return false;
  }
}

/**
 * 安全地比較兩個字串（防止時序攻擊）
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

/**
 * 生成隨機密鑰（用於 ENCRYPTION_KEY）
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
