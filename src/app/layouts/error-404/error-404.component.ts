import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-404-layout',
  standalone: true,
  templateUrl: './error-404.component.html',
  styleUrls: ['./error-404.component.scss'],
})
export class Error404LayoutComponent {
  @Input() imageSrc: string = 'https://s3.vn-hcm-1.vietnix.cloud/bravos/uploads/Group%20652.svg';
  @Input() title: string = '404';
  @Input() description: string =
    'He thong dang gap su co. Xin loi vi su bat tien nay. Vui long quay tro lai trong it phut nua.';
}
