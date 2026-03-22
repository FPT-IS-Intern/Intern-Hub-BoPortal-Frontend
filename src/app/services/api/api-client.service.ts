import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '@/core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '@/core/interceptors/api-error.interceptor';

type PrimitiveParam = string | number | boolean;
type RequestParams = HttpParams | Record<string, PrimitiveParam | readonly PrimitiveParam[]>;
type RequestHeaders = HttpHeaders | Record<string, string | string[]>;

export interface ApiRequestOptions {
  context?: HttpContext;
  headers?: RequestHeaders;
  params?: RequestParams;
  skipErrorToast?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http = inject(HttpClient);

  url(path: string): string {
    return buildApiUrl(path);
  }

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(this.url(path), this.buildOptions(options));
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.url(path), body, this.buildOptions(options));
  }

  put<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<T>(this.url(path), body, this.buildOptions(options));
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.url(path), body, this.buildOptions(options));
  }

  delete<T>(path: string, options?: ApiRequestOptions & { body?: unknown }): Observable<T> {
    return this.http.delete<T>(this.url(path), this.buildOptions(options));
  }

  private buildOptions(options?: ApiRequestOptions & { body?: unknown }): {
    body?: unknown;
    context: HttpContext;
    headers?: RequestHeaders;
    params?: RequestParams;
  } {
    let context = options?.context ?? new HttpContext();

    if (options?.skipErrorToast) {
      context = context.set(SKIP_API_ERROR_TOAST, true);
    }

    return {
      body: options?.body,
      context,
      headers: options?.headers,
      params: options?.params,
    };
  }
}
