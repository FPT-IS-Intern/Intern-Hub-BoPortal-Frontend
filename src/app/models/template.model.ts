export interface TemplateResponse {
  id: string;
  code: string;
  channel: string;
  locale: string;
  subject?: string;
  content: string;
  format: string;
  active: boolean;
  templateVersion: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  paramsSchema?: string;
}

export interface TemplateSummaryResponse {
  code: string;
  description?: string;
  channels: string[];
  updatedAt: string;
  isDeletable: boolean;
}

export interface TemplateSummaryPageResponse {
  items: TemplateSummaryResponse[];
  total: number;
  page: number;
  size: number;
}

export interface TemplateChannelAvailabilityResponse {
  code: string;
  locale?: string;
  activeChannels: string[];
  availableChannels: string[];
}

export interface TemplateDefinitionResponse {
  code: string;
  paramsSchema?: string;
}

export interface TemplateDefinitionCreateRequest {
  code: string;
  paramsSchema?: string;
}

export interface TemplateDefinitionUpdateRequest {
  paramsSchema?: string;
}

export interface TemplateUpsertRequest {
  code: string;
  channel: string;
  locale: string;
  subject?: string;
  content: string;
  format: string;
  active: boolean;
  paramsSchema?: string;
}

export interface TemplateRestoreRequest {
  channel: string;
  locale: string;
  templateVersion: number;
}
