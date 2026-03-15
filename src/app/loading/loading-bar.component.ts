import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <progress class="top-progress" *ngIf="isLoading()"></progress>
  `,
  styles: [`
    .top-progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 1000000;
      appearance: none;
      -webkit-appearance: none;
      border: none;
      background: transparent;
      pointer-events: none;
      display: block;
    }

    .top-progress::-webkit-progress-bar {
      background: transparent;
    }

    .top-progress::-webkit-progress-value {
      background: var(--app-color-primary, #e18308);
      box-shadow: 0 0 10px var(--app-color-primary-alpha-60, rgba(225, 131, 8, 0.6));
    }

    .top-progress::-moz-progress-bar {
      background: var(--app-color-primary, #e18308);
    }

    .top-progress:indeterminate {
      background-image: linear-gradient(
        90deg,
        transparent 0%,
        var(--app-color-primary, #e18308) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: progress-indeterminate 1.5s infinite linear;
    }

    @keyframes progress-indeterminate {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  private readonly loadingService = inject(LoadingService);
  protected readonly isLoading = this.loadingService.isLoading;
}
