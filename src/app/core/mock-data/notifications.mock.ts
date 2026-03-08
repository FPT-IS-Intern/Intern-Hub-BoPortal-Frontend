export interface NotificationRecord {
    id: string;
    code: string;
    content: string;
}

export const NOTIFICATION_TEMPLATES: Array<Pick<NotificationRecord, 'code' | 'content'>> = [
    {
        code: 'REMOTE_ONSITE_PENDING',
        content: 'Yeu cau dang ky Remote/Onsite da duoc gui va dang cho phe duyet.',
    },
    {
        code: 'REMOTE_ONSITE_APPROVED',
        content: 'Yeu cau Remote/Onsite da duoc phe duyet. Vui long kiem tra lich lam viec.',
    },
    {
        code: 'REMOTE_ONSITE_REJECTED',
        content: 'Yeu cau Remote/Onsite da bi tu choi. Vui long xem ly do de cap nhat.',
    },
    {
        code: 'USER_FEEDBACK',
        content: 'Phan hoi cua ban da duoc ghi nhan. He thong se xu ly trong thoi gian som nhat.',
    },
    {
        code: 'REMIND_PASSWORD',
        content: 'Mat khau sap het han. Vui long doi mat khau de tranh gian doan dang nhap.',
    },
    {
        code: 'ANNOUNCEMENT',
        content: 'He thong se bao tri dinh ky vao cuoi tuan. Vui long sap xep cong viec phu hop.',
    },
];

export function createMockNotifications(total: number): NotificationRecord[] {
    return Array.from({ length: total }, (_, index) => {
        const template = NOTIFICATION_TEMPLATES[index % NOTIFICATION_TEMPLATES.length];
        const id = index + 1;

        return {
            id: String(id),
            code: template.code,
            content: `${template.content} (Mock #${id})`,
        };
    });
}
