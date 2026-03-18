import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkin-tabs-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkin-tabs-skeleton.component.html',
  styleUrl: './checkin-tabs-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinTabsSkeletonComponent {
  @Input() tableOnly = false;
}
