import { GeneralConfig } from './general-config.model';
import { SecurityConfig } from './security-config.model';

export interface UiClientConfig {
  appName: string;
  logoUrl?: string | null;
  defaultLanguage: string;
}

export interface WorkingTimeConfig {
  workStartTime: string;
  workEndTime: string;
  autoCheckoutTime: string;
}

export interface SystemConfiguration {
  uiClientConfig?: UiClientConfig;
  workingTimeConfig?: WorkingTimeConfig;
  securityConfig?: SecurityConfig;
}

export interface SystemConfigUpdateRequest extends GeneralConfig {
  updatedBy?: string | null;
}

export interface SecurityConfigUpdateRequest extends SecurityConfig {
  updatedBy?: string | null;
}
