import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../services/common/loading.service';

@Component({
  selector: 'app-top-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="top-progress-container" *ngIf="isLoading()">
      <div class="top-progress-bar"></div>
    </div>
  `,
  styles: [`
    .top-progress-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: rgba(var(--app-color-primary-rgb, 225, 131, 8), 0.2); /* Darker track for better contrast */
      z-index: 3000000; /* Higher than global overlay (2,000,000) */
      overflow: hidden;
      pointer-events: none;
    }

    .top-progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 30%; /* Narrower for a 'streak' look */
      /* Shooting star gradient effect */
      background: linear-gradient(
        90deg, 
        transparent 0%, 
        rgba(255, 109, 0, 0.4) 20%, 
        #ff6d00 50%, 
        rgba(255, 109, 0, 0.4) 80%, 
        transparent 100%
      );
      animation: top-progress-streak 0.8s infinite ease-in-out;
    }

    @keyframes top-progress-streak {
      0% {
        transform: translateX(-150%);
      }
      100% {
        transform: translateX(350%);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopProgressBarComponent {
  private readonly loadingService = inject(LoadingService);
  protected readonly isLoading = this.loadingService.isLoading;
}
