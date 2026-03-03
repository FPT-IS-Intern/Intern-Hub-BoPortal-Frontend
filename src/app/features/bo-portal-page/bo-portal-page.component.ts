import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';

interface BoPortalPageViewModel {
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string; tone: 'brand' | 'neutral' | 'success' }>;
}

@Component({
  selector: 'app-bo-portal-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bo-portal-page.component.html',
  styleUrl: './bo-portal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoPortalPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly viewModel$ = this.route.data.pipe(
    map(
      (data): BoPortalPageViewModel => ({
        title: (data['title'] as string) || 'BoPortal',
        subtitle:
          (data['subtitle'] as string) ||
          'Khu vực quản trị nội bộ đang vận hành như một ứng dụng độc lập của BoPortal.',
        metrics:
          (data['metrics'] as BoPortalPageViewModel['metrics']) || [
            { label: 'Trạng thái', value: 'Sẵn sàng', tone: 'success' },
            { label: 'Kiểu ứng dụng', value: 'Độc lập', tone: 'brand' },
            { label: 'Điều hướng', value: 'Nội bộ', tone: 'neutral' },
          ],
      }),
    ),
  );
}
