import { NotificationRecord } from '../../models/notification.model';

export const NOTIFICATION_MOCKS: NotificationRecord[] = [
  { 
    id: 1, 
    title: 'Nhắc nhở: Quên Check-out hôm qua', 
    content: 'Hệ thống ghi nhận bạn chưa thực hiện Check-out vào ngày 14/03/2026. Vui lòng bổ sung giải trình để đảm bảo công xá chính xác.', 
    audience: 'Specific', 
    status: 'Sent', 
    type: 'Warning', 
    createdAt: '2026-03-15T08:00:00Z', 
    sentAt: '2026-03-15T08:05:00Z' 
  },
  { 
    id: 2, 
    title: 'Phê duyệt Timesheet tuần 10', 
    content: 'Đã có 5 phiếu ghi nhận công việc (Timesheet) đang chờ bạn phê duyệt. Hạn cuối vào 17:00 chiều nay.', 
    audience: 'Specific', 
    status: 'Sent', 
    type: 'System', 
    createdAt: '2026-03-15T09:30:00Z', 
    sentAt: '2026-03-15T09:35:00Z' 
  },
  { 
    id: 3, 
    title: 'Thông báo: Chế độ làm việc bù lễ', 
    content: 'Ban nhân sự thông báo lịch làm việc bù cho ngày lễ Giỗ Tổ Hùng Vương sắp tới. Chi tiết đính kèm trong sổ tay nhân viên.', 
    audience: 'All', 
    status: 'Scheduled', 
    type: 'System', 
    createdAt: '2026-03-14T10:00:00Z', 
    scheduleTime: '2026-03-16T08:00:00Z' 
  },
  { 
    id: 4, 
    title: 'Cập nhật địa điểm Check-in mới', 
    content: 'Văn phòng chi nhánh phía Nam vừa được bổ sung vào danh sách các địa điểm check-in hợp lệ. Nhân viên tại khu vực này có thể sử dụng ngay.', 
    audience: 'Group', 
    status: 'Sent', 
    type: 'System', 
    createdAt: '2026-03-14T14:45:00Z', 
    sentAt: '2026-03-14T15:00:00Z' 
  },
  { 
    id: 5, 
    title: 'Khảo sát độ hài lòng nhân viên Quý 1', 
    content: 'InterHub mong muốn lắng nghe ý kiến của bạn để cải thiện môi trường làm việc. Phiếu này sẽ đóng sau 3 ngày.', 
    audience: 'All', 
    status: 'Draft', 
    type: 'System', 
    createdAt: '2026-03-13T16:20:00Z' 
  },
  { 
    id: 6, 
    title: 'Cảnh báo: Phát hiện thiết bị lạ đăng nhập', 
    content: 'Tài khoản của bạn vừa đăng nhập từ một thiết bị Android lạ tại khu vực Quận 7. Nếu không phải bạn, hãy đổi mật khẩu ngay.', 
    audience: 'Specific', 
    status: 'Sent', 
    type: 'Warning', 
    createdAt: '2026-03-15T11:00:00Z', 
    sentAt: '2026-03-15T11:02:00Z'
  }
];

export const NOTIFICATION_STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: null },
  { label: 'Đã gửi', value: 'Sent' },
  { label: 'Nháp', value: 'Draft' },
  { label: 'Đã lên lịch', value: 'Scheduled' }
];

export const NOTIFICATION_TYPE_OPTIONS = [
  { label: 'Thông báo hệ thống', value: 'System' },
  { label: 'Tin tức nội bộ', value: 'Promotion' },
  { label: 'Cảnh báo quan trọng', value: 'Warning' }
];

export const NOTIFICATION_AUDIENCE_OPTIONS = [
  { label: 'Tất cả nhân viên', value: 'All' },
  { label: 'Nhóm đơn vị/Phòng ban', value: 'Group' },
  { label: 'Cá nhân cụ thể', value: 'Specific' }
];
