import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-drawer-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-drawer-skeleton.component.html',
  styleUrl: './user-drawer-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDrawerSkeletonComponent {}
