export interface SecurityConfig {
    minLength: number;
    maxLength: number;
    uppercaseCount: number;
    digitCount: number;
    expirationDays: number;
    specialCharCount: number;
    autoLogoutMinutes: number;
    maxLoginAttempts: number;
    allowSpace: boolean;
}
