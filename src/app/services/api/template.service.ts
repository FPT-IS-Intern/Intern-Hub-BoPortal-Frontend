import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import {
  TemplateResponse,
  TemplateSummaryPageResponse,
  TemplateChannelAvailabilityResponse,
  TemplateDefinitionResponse,
  TemplateDefinitionCreateRequest,
  TemplateDefinitionUpdateRequest,
  TemplateUpsertRequest,
  TemplateRestoreRequest
} from '@/models/template.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(private readonly apiClient: ApiClientService) {}

  /**
   * List templates with filters
   */
  listTemplates(params: {
    code?: string;
    channel?: string;
    locale?: string;
    active?: boolean;
    page?: number;
    size?: number;
  } = {}): Observable<ResponseApi<TemplateResponse[]>> {
    let httpParams = new HttpParams();

    if (params.code) httpParams = httpParams.set('code', params.code);
    if (params.channel) httpParams = httpParams.set('channel', params.channel);
    if (params.locale) httpParams = httpParams.set('locale', params.locale);
    if (params.active !== undefined) httpParams = httpParams.set('active', params.active);
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);

    return this.apiClient.get<ResponseApi<TemplateResponse[]>>(API_ENDPOINTS.templates.root, { params: httpParams });
  }

  /**
   * List templates summary by code
   */
  listTemplateSummaries(params: {
    code?: string;
    channel?: string;
    lang?: string;
    page?: number;
    size?: number;
  } = {}): Observable<ResponseApi<TemplateSummaryPageResponse>> {
    let httpParams = new HttpParams();

    if (params.code) httpParams = httpParams.set('code', params.code);
    if (params.channel) httpParams = httpParams.set('channel', params.channel);
    if (params.lang) httpParams = httpParams.set('lang', params.lang);
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);

    return this.apiClient.get<ResponseApi<TemplateSummaryPageResponse>>(API_ENDPOINTS.templates.summary, { params: httpParams });
  }

  /**
   * Get active and available channels for template code
   */
  getTemplateChannels(code: string, lang?: string): Observable<ResponseApi<TemplateChannelAvailabilityResponse>> {
    let httpParams = new HttpParams();
    if (lang) httpParams = httpParams.set('lang', lang);

    return this.apiClient.get<ResponseApi<TemplateChannelAvailabilityResponse>>(API_ENDPOINTS.templates.channels(code), { params: httpParams });
  }

  /**
   * Get template definition by code
   */
  getTemplateDefinition(code: string): Observable<ResponseApi<TemplateDefinitionResponse>> {
    return this.apiClient.get<ResponseApi<TemplateDefinitionResponse>>(API_ENDPOINTS.templates.definitionByCode(code));
  }

  /**
   * Create template definition
   */
  createTemplateDefinition(request: TemplateDefinitionCreateRequest): Observable<ResponseApi<TemplateDefinitionResponse>> {
    return this.apiClient.post<ResponseApi<TemplateDefinitionResponse>>(API_ENDPOINTS.templates.definitionRoot, request);
  }

  /**
   * Update template definition by code
   */
  updateTemplateDefinition(code: string, request: TemplateDefinitionUpdateRequest): Observable<ResponseApi<TemplateDefinitionResponse>> {
    return this.apiClient.put<ResponseApi<TemplateDefinitionResponse>>(API_ENDPOINTS.templates.definitionByCode(code), request);
  }

  /**
   * Delete template definition by code
   */
  deleteTemplateDefinition(code: string): Observable<ResponseApi<boolean>> {
    return this.apiClient.delete<ResponseApi<boolean>>(API_ENDPOINTS.templates.definitionDelete(code));
  }

  /**
   * Get template version history
   */
  getTemplateHistory(code: string, channel: string, lang?: string): Observable<ResponseApi<TemplateResponse[]>> {
    let httpParams = new HttpParams().set('channel', channel);
    if (lang) httpParams = httpParams.set('lang', lang);

    return this.apiClient.get<ResponseApi<TemplateResponse[]>>(API_ENDPOINTS.templates.history(code), { params: httpParams });
  }

  /**
   * Restore template version
   */
  restoreTemplate(code: string, request: TemplateRestoreRequest): Observable<ResponseApi<TemplateResponse>> {
    return this.apiClient.put<ResponseApi<TemplateResponse>>(API_ENDPOINTS.templates.restore(code), request);
  }

  /**
   * Create template
   */
  createTemplate(request: TemplateUpsertRequest): Observable<ResponseApi<TemplateResponse>> {
    return this.apiClient.post<ResponseApi<TemplateResponse>>(API_ENDPOINTS.templates.root, request);
  }

  /**
   * Update template
   */
  updateTemplate(id: string, request: TemplateUpsertRequest): Observable<ResponseApi<TemplateResponse>> {
    return this.apiClient.put<ResponseApi<TemplateResponse>>(API_ENDPOINTS.templates.byId(id), request);
  }
}
