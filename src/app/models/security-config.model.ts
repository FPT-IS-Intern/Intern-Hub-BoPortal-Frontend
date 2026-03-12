export interface SecurityConfig {
    minPasswordLength: number;
    maxPasswordLength: number;
    minUppercaseChars: number;
    minSpecialChars: number;
    minNumericChars: number;
    passwordExpiryDays: number;
    allowWhitespace: boolean;
    autoLogoutMinutes: number;
    maxLoginAttempts: number;
}
