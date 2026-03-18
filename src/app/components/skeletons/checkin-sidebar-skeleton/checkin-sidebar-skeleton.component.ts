import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkin-sidebar-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkin-sidebar-skeleton.component.html',
  styleUrl: './checkin-sidebar-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinSidebarSkeletonComponent {}
