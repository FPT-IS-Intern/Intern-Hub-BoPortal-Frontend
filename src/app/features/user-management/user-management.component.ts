import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoDataComponent } from '../../components/no-data/no-data.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, NoDataComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent {}
