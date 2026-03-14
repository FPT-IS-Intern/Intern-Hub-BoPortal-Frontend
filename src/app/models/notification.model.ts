export interface NotificationRecord {
    id: number;
    title: string;
    content: string;
    audience: 'All' | 'Group' | 'Specific';
    audienceDetails?: string;
    status: 'Sent' | 'Draft' | 'Scheduled';
    type: 'System' | 'Promotion' | 'Warning';
    createdAt: string;
    sentAt?: string;
    thumbnail?: string;
    onclickAction?: string;
    scheduleTime?: string;
}
