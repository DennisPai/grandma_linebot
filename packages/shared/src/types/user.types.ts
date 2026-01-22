export interface User {
  userId: string;
  displayName?: string;
  firstContactAt: Date;
  lastActiveAt: Date;
  profileSummary?: Record<string, any>;
  preferences?: Record<string, any>;
}

export interface MorningSchedule {
  userId: string;
  nextSendTime: Date;
  sendWindowStart: string;
  sendWindowEnd: string;
  timezone: string;
  enabled: boolean;
}
