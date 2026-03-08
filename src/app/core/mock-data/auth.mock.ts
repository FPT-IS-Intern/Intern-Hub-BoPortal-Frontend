import { LoginResponse } from '../../models/auth.model';

export const MOCK_USER = {
    username: 'admin',
    password: '123',
};

export const MOCK_LOGIN_RESPONSE: LoginResponse = {
    accessToken: 'mock-access-token-' + Math.random().toString(36).substring(7),
    refreshToken: 'mock-refresh-token-' + Math.random().toString(36).substring(7),
    user: {
        id: '1',
        username: 'admin',
        fullName: 'Quản trị viên',
        role: 'ADMIN',
    },
};
