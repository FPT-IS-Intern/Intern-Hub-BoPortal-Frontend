import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeaderData {
  logo?: string;
}

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() data: HeaderData = {
    logo: 'assets/FPT-IS-Logo.png',
  };

  @Input() paddingHeader: string = '12px 20px 12px 16px';
}
