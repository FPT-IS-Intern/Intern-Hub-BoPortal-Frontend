import { Injectable, signal } from '@angular/core';
import { BreadcrumbItem } from '@/components/breadcrumb/breadcrumb.component';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);
  
  readonly breadcrumbs = this._breadcrumbs.asReadonly();

  setBreadcrumbs(items: BreadcrumbItem[]): void {
    this._breadcrumbs.set(items);
  }

  clearBreadcrumbs(): void {
    this._breadcrumbs.set([]);
  }
}
