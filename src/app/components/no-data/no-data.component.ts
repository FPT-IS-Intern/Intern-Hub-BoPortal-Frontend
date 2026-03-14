import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-no-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './no-data.component.html',
  styleUrl: './no-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoDataComponent {
  title = input<string>('Không có dữ liệu');
  message = input<string>('Hiện tại không có thông báo nào để hiển thị.');
  size = input<'large' | 'small'>('large');
  fullHeight = input<boolean>(true);
  showAction = input<boolean>(false);
  actionText = input<string>('Thử lại');

  actionClicked = output<void>();
}
