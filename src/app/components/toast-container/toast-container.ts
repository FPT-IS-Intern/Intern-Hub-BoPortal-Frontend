import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@/services/common/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toastsSignal(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="toastService.remove(toast.id)">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <span class="custom-icon-success"></span>
            } @else if (toast.type === 'error') {
              <span class="custom-icon-error"></span>
            } @else if (toast.type === 'warning') {
              <span class="custom-icon-warning"></span>
            } @else {
              <span class="custom-icon-info"></span>
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="$event.stopPropagation(); toastService.remove(toast.id)">
            <span class="custom-icon-close" style="width: 16px; height: 16px;"></span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      min-width: 300px;
      max-width: 450px;
      padding: 16px;
      border-radius: 12px;
      background: var(--app-color-white, #fff);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid var(--app-color-primary-alpha-8, rgba(0, 0, 0, 0.08));
      cursor: pointer;
      animation: toast-in 0.3s cubic-bezier(0, 0, 0.2, 1);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      &.success {
        border-left: 4px solid #10b981;
        .toast-icon { color: #10b981; }
      }
      &.error {
        border-left: 4px solid #ef4444;
        .toast-icon { color: #ef4444; }
      }
      &.warning {
        border-left: 4px solid #f59e0b;
        .toast-icon { color: #f59e0b; }
      }
      &.info {
        border-left: 4px solid #3b82f6;
        .toast-icon { color: #3b82f6; }
      }
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 700;
      font-size: 14px;
      color: var(--app-color-text-main, #1e293b);
      margin-bottom: 2px;
    }

    .toast-message {
      font-size: 14px;
      color: var(--app-color-text-muted, #64748b);
      line-height: 1.5;
    }

    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 4px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover {
        background: #f1f5f9;
        color: #64748b;
      }
    }

    @keyframes toast-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}


