import { ClientConfig } from '@line/bot-sdk';

export const lineConfig: ClientConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
};

if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.warn('Warning: LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN not set');
}
