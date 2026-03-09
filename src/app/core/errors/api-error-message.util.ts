import { HttpErrorResponse } from '@angular/common/http';

type ApiResponseStatus = {
  code?: string;
  message?: string;
};

type ApiErrorEnvelope = {
  status?: ApiResponseStatus;
};

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  '1401': 'Sai tên đăng nhập hoặc mật khẩu.',
  '1402': 'Tài khoản đang bị vô hiệu hóa.',
  '1403': 'Tài khoản đang tạm khóa, vui lòng thử lại sau.',
  '1404': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  '1405': 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.',
  '1406': 'Thiết bị đăng nhập không khớp.',
  '1407': 'Thông tin phiên không hợp lệ.',
  '1408': 'Không tìm thấy tài khoản người dùng.',
  '1409': 'Thiếu thông tin xác thực.',
  '1410': 'Không thể xử lý token. Vui lòng thử lại.',
  '0400': 'Yêu cầu không hợp lệ.',
  '0404': 'Không tìm thấy dữ liệu.',
  '0500': 'Hệ thống đang bận, vui lòng thử lại sau.',
};

const DEFAULT_ERROR_MESSAGE = 'Không thể kết nối máy chủ. Vui lòng thử lại.';

function getMessageByCode(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }
  return ERROR_MESSAGE_BY_CODE[code];
}

export function resolveApiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const envelope = error.error as ApiErrorEnvelope | undefined;
    const code = envelope?.status?.code;
    const mapped = getMessageByCode(code);
    if (mapped) {
      return mapped;
    }

    const rawMessage = envelope?.status?.message;
    if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
      return rawMessage;
    }

    return DEFAULT_ERROR_MESSAGE;
  }

  return DEFAULT_ERROR_MESSAGE;
}

export function resolveBusinessMessage(code?: string, fallbackMessage?: string): string {
  const mapped = getMessageByCode(code);
  if (mapped) {
    return mapped;
  }

  if (typeof fallbackMessage === 'string' && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  return DEFAULT_ERROR_MESSAGE;
}
