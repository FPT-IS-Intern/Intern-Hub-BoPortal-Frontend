import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-overlay-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-overlay-spinner.component.html',
  styleUrls: ['./global-overlay-spinner.component.scss'],
})
export class GlobalOverlaySpinnerComponent {
  private readonly loading = inject(LoadingService);
  readonly isLoading = this.loading.isLoading;
}
