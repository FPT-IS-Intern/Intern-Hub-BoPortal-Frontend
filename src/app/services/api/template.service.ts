import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import {
  TemplateResponse,
  TemplateSummaryPageResponse,
  TemplateChannelAvailabilityResponse,
  TemplateDefinitionResponse,
  TemplateDefinitionCreateRequest,
  TemplateDefinitionUpdateRequest,
  TemplateUpsertRequest,
  TemplateRestoreRequest
} from '../../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/templates`;

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

    return this.http.get<ResponseApi<TemplateResponse[]>>(this.baseUrl, { params: httpParams });
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

    return this.http.get<ResponseApi<TemplateSummaryPageResponse>>(`${this.baseUrl}/summary`, { params: httpParams });
  }

  /**
   * Get active and available channels for template code
   */
  getTemplateChannels(code: string, lang?: string): Observable<ResponseApi<TemplateChannelAvailabilityResponse>> {
    let httpParams = new HttpParams();
    if (lang) httpParams = httpParams.set('lang', lang);

    return this.http.get<ResponseApi<TemplateChannelAvailabilityResponse>>(`${this.baseUrl}/${code}/channels`, { params: httpParams });
  }

  /**
   * Get template definition by code
   */
  getTemplateDefinition(code: string): Observable<ResponseApi<TemplateDefinitionResponse>> {
    return this.http.get<ResponseApi<TemplateDefinitionResponse>>(`${this.baseUrl}/${code}/definition`);
  }

  /**
   * Create template definition
   */
  createTemplateDefinition(request: TemplateDefinitionCreateRequest): Observable<ResponseApi<TemplateDefinitionResponse>> {
    return this.http.post<ResponseApi<TemplateDefinitionResponse>>(`${this.baseUrl}/definition`, request);
  }

  /**
   * Update template definition by code
   */
  updateTemplateDefinition(code: string, request: TemplateDefinitionUpdateRequest): Observable<ResponseApi<TemplateDefinitionResponse>> {
    return this.http.put<ResponseApi<TemplateDefinitionResponse>>(`${this.baseUrl}/${code}/definition`, request);
  }

  /**
   * Delete template definition by code
   */
  deleteTemplateDefinition(code: string): Observable<ResponseApi<boolean>> {
    return this.http.delete<ResponseApi<boolean>>(`${this.baseUrl}/definition/${code}`);
  }

  /**
   * Get template version history
   */
  getTemplateHistory(code: string, channel: string, lang?: string): Observable<ResponseApi<TemplateResponse[]>> {
    let httpParams = new HttpParams().set('channel', channel);
    if (lang) httpParams = httpParams.set('lang', lang);

    return this.http.get<ResponseApi<TemplateResponse[]>>(`${this.baseUrl}/${code}/history`, { params: httpParams });
  }

  /**
   * Restore template version
   */
  restoreTemplate(code: string, request: TemplateRestoreRequest): Observable<ResponseApi<TemplateResponse>> {
    return this.http.put<ResponseApi<TemplateResponse>>(`${this.baseUrl}/${code}/restore`, request);
  }

  /**
   * Create template
   */
  createTemplate(request: TemplateUpsertRequest): Observable<ResponseApi<TemplateResponse>> {
    return this.http.post<ResponseApi<TemplateResponse>>(this.baseUrl, request);
  }

  /**
   * Update template
   */
  updateTemplate(id: string, request: TemplateUpsertRequest): Observable<ResponseApi<TemplateResponse>> {
    return this.http.put<ResponseApi<TemplateResponse>>(`${this.baseUrl}/${id}`, request);
  }
}
