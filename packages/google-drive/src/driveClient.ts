import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';

let driveClient: drive_v3.Drive | null = null;

export function getGoogleDriveClient(): drive_v3.Drive {
  if (!driveClient) {
    const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS 
      ? JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS)
      : null;

    if (!credentials) {
      throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    driveClient = google.drive({ version: 'v3', auth });
  }

  return driveClient;
}

export async function getOrCreateFolder(
  drive: drive_v3.Drive,
  folderPath: string
): Promise<string> {
  const parts = folderPath.split('/').filter(p => p);
  let parentId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!parentId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not set');
  }

  for (const part of parts) {
    // 檢查資料夾是否存在
    const response = await drive.files.list({
      q: `name='${part}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      parentId = response.data.files[0].id!;
    } else {
      // 建立新資料夾
      const folderMetadata = {
        name: part,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      parentId = folder.data.id!;
    }
  }

  return parentId;
}
