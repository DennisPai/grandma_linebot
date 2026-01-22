import { getGoogleDriveClient, getOrCreateFolder } from './driveClient.js';
import { Readable } from 'stream';

export interface UploadOptions {
  filename: string;
  folder: string;
  mimeType?: string;
}

/**
 * 上傳 Buffer 到 Google Drive
 */
export async function uploadBufferToGoogleDrive(
  buffer: Buffer,
  options: UploadOptions
): Promise<string> {
  if (!process.env.GOOGLE_DRIVE_ENABLED || process.env.GOOGLE_DRIVE_ENABLED !== 'true') {
    console.warn('Google Drive not enabled, returning local path');
    return `/temp/${options.filename}`;
  }

  try {
    const drive = getGoogleDriveClient();
    const folderId = await getOrCreateFolder(drive, options.folder);

    const fileMetadata = {
      name: options.filename,
      parents: [folderId]
    };

    const media = {
      mimeType: options.mimeType || 'image/jpeg',
      body: Readable.from(buffer)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    // 設定為公開存取
    await drive.permissions.create({
      fileId: file.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // 返回直接存取 URL
    const permanentUrl = `https://drive.google.com/uc?export=view&id=${file.data.id}`;

    console.log(`✅ Uploaded to Google Drive: ${permanentUrl}`);
    return permanentUrl;

  } catch (error: any) {
    console.error('❌ Failed to upload to Google Drive:', error.message);
    throw error;
  }
}

/**
 * 上傳 URL 的圖片到 Google Drive
 */
export async function uploadImageURLToGoogleDrive(
  imageUrl: string,
  options: UploadOptions
): Promise<string> {
  // 下載圖片
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return uploadBufferToGoogleDrive(buffer, options);
}
