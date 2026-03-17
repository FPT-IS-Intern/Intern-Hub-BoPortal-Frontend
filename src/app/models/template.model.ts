export type ParamsSchemaObject = Record<string, { description?: string } | string>;
export type ParamsSchemaPayload = ParamsSchemaObject | string;

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
  paramsSchema?: ParamsSchemaPayload;
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
  paramsSchema?: ParamsSchemaPayload;
  description?: string;
}

export interface TemplateDefinitionCreateRequest {
  code: string;
  paramsSchema?: ParamsSchemaPayload;
  description?: string;
}

export interface TemplateDefinitionUpdateRequest {
  paramsSchema?: ParamsSchemaPayload;
  description?: string;
}

export interface TemplateUpsertRequest {
  code: string;
  channel: string;
  locale: string;
  subject?: string;
  content: string;
  format: string;
  active: boolean;
  paramsSchema?: ParamsSchemaPayload;
}

export interface TemplateRestoreRequest {
  channel: string;
  lang?: string;
  version: number;
}
