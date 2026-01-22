import { getGoogleDriveClient } from './driveClient.js';

/**
 * 驗證 Google Drive 連接
 */
export async function verifyGoogleDriveConnection(): Promise<boolean> {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)'
    });

    console.log('✅ Google Drive connection verified');
    return true;
  } catch (error: any) {
    console.error('❌ Google Drive connection failed:', error.message);
    return false;
  }
}

/**
 * 取得儲存空間使用情況
 */
export async function getStorageUsage() {
  try {
    const drive = getGoogleDriveClient();
    const about = await drive.about.get({
      fields: 'storageQuota'
    });

    const quota = about.data.storageQuota;
    
    return {
      limit: parseInt(quota?.limit || '0'),
      usage: parseInt(quota?.usage || '0'),
      usageInDrive: parseInt(quota?.usageInDrive || '0')
    };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return null;
  }
}
