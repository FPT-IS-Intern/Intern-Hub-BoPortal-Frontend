import { Component } from '@angular/core';

@Component({
  selector: 'app-permission-matrix-skeleton',
  standalone: true,
  templateUrl: './permission-matrix-skeleton.component.html',
  styleUrl: './permission-matrix-skeleton.component.scss',
})
export class PermissionMatrixSkeletonComponent {
  readonly rows = Array.from({ length: 8 }, (_, index) => index);
}
