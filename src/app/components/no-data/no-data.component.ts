import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-no-data',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="no-data-container" [class.full-height]="fullHeight()">
      <div class="no-data-content">
        <div class="no-data-icon-wrapper">
          <ng-content select="[icon]">
            <span class="custom-icon-box-iso" [style.width]="iconSize()" [style.height]="iconSize()"></span>
          </ng-content>
        </div>
        <h3 class="no-data-title">{{ title() }}</h3>
        <p class="no-data-message">{{ message() }}</p>
        <div class="no-data-actions" *ngIf="showAction()">
          <button (click)="actionClicked.emit()" class="action-btn">
            {{ actionText() }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .no-data-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      width: 100%;
      background: transparent;

      &.full-height {
        min-height: 400px;
      }
    }

    .no-data-content {
      text-align: center;
      max-width: 320px;
      animation: fade-in-up 0.5s cubic-bezier(0, 0, 0.2, 1);
    }

    .no-data-icon-wrapper {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
      color: var(--app-color-primary-alpha-20, rgba(0, 0, 0, 0.2));
      opacity: 0.5;
    }

    .no-data-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--app-color-text-main, #1e293b);
      margin-bottom: 8px;
    }

    .no-data-message {
      font-size: 14px;
      color: var(--app-color-text-muted, #64748b);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .action-btn {
      padding: 10px 24px;
      background: var(--app-color-primary, #2563eb);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);

      &:hover {
        background: var(--app-color-primary-dark, #1d4ed8);
        transform: translateY(-1px);
        box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
      }

      &:active {
        transform: translateY(0);
      }
    }

    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoDataComponent {
  title = input<string>('Không có dữ liệu');
  message = input<string>('Hiện tại không có thông cá nào để hiển thị.');
  iconSize = input<string>('64px');
  fullHeight = input<boolean>(true);
  showAction = input<boolean>(false);
  actionText = input<string>('Thử lại');

  actionClicked = output<void>();
}
