import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingService } from '../../../services/common/loading.service';

@Component({
  selector: 'app-global-overlay-spinner',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './global-overlay-spinner.component.html',
  styleUrls: ['./global-overlay-spinner.component.scss'],
})
export class GlobalOverlaySpinnerComponent {
  private readonly loading: LoadingService = inject(LoadingService);
  readonly isLoading = this.loading.isLoading;
}
