export interface GeneralConfig {
    appName: string;
    logoUrl?: string;
    language: string;
    workingTime: Date | string | null;
    shiftEndTime: Date | string | null;
    autoCheckout: Date | string | null;
}
