import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-settings-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-settings-skeleton.component.html',
  styleUrl: './system-settings-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSettingsSkeletonComponent {}
