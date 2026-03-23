export type TemplateChannel = 'EMAIL' | 'PUSH' | 'IN_APP' | 'IN-APP';
export type TemplateFormat = 'HTML' | 'TEXT';
export type ParamsSchemaEntry = string | { description?: string };
export type ParamsSchemaObject = Record<string, ParamsSchemaEntry>;
export type ParamsSchemaPayload = ParamsSchemaObject | string;

export interface TemplateListQuery {
  code?: string;
  channel?: TemplateChannel;
  locale?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface TemplateSummaryQuery {
  code?: string;
  channel?: TemplateChannel;
  lang?: string;
  page?: number;
  size?: number;
}

export interface TemplateResponse {
  id: string;
  code: string;
  channel: TemplateChannel;
  locale: string;
  subject?: string;
  content: string;
  format: TemplateFormat;
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
  channels: TemplateChannel[];
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
  activeChannels: TemplateChannel[];
  availableChannels: TemplateChannel[];
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
  channel: TemplateChannel;
  locale: string;
  subject?: string;
  content: string;
  format: TemplateFormat;
  active: boolean;
  paramsSchema?: ParamsSchemaPayload;
}

export interface TemplateRestoreRequest {
  channel: TemplateChannel;
  lang?: string;
  version: number;
}
