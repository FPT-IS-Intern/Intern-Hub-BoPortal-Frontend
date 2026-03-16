import { GeneralConfig } from './general-config.model';
import { SecurityConfig } from './security-config.model';

export interface SystemConfiguration {
  systemConfig: GeneralConfig;
  securityConfig: SecurityConfig;
}

export interface SystemConfigUpdateRequest extends GeneralConfig {
  updatedBy?: string | null;
}

export interface SecurityConfigUpdateRequest extends SecurityConfig {
  updatedBy?: string | null;
}
