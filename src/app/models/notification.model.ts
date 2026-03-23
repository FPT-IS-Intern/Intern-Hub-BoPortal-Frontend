export type NotificationAudience = 'All' | 'Group' | 'Specific';
export type NotificationStatus = 'Sent' | 'Draft' | 'Scheduled';
export type NotificationType = 'System' | 'Promotion' | 'Warning';

export interface NotificationRecord {
  id: number;
  title: string;
  content: string;
  audience: NotificationAudience;
  audienceDetails?: string;
  status: NotificationStatus;
  type: NotificationType;
  createdAt: string;
  sentAt?: string;
  thumbnail?: string;
  onclickAction?: string;
  scheduleTime?: string;
}

export interface NotificationUpsertRequest {
  title: string;
  content: string;
  audience: NotificationAudience;
  type: NotificationType;
  audienceDetails?: string;
  onclickAction?: string;
  scheduleTime?: string;
}

export interface NotificationUpdateRequest extends Partial<NotificationUpsertRequest> {}
