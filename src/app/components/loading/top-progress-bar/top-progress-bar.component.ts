import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../services/common/loading.service';

@Component({
  selector: 'app-top-progress-bar',
  standalone: true,
  imports: [],
  templateUrl: './top-progress-bar.component.html',
  styleUrl: './top-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopProgressBarComponent {
  private readonly loadingService = inject(LoadingService);
  protected readonly isLoading = this.loadingService.isPageLoading;
}
