import { Routes } from '@angular/router';
import { PermissionMatrixComponent } from './features/permission-matrix/permission-matrix.component';
import { NotificationBellComponent } from './features/notification-bell/notification-bell.component';
import { BoPortalLayoutComponent } from './layouts/main-layout/bo-portal-layout.component';
import { Error404LayoutComponent } from './layouts/error-404/error-404.component';
import { LoginFormComponent } from './features/login/login-form.component';
import { authGuard } from './core/guards/auth.guard';
import { CheckinLocationComponent } from './features/checkin-location/checkin-location.component';
import { SystemSettingsComponent } from './features/system-settings/system-settings.component';
import { UserManagementComponent } from './features/user-management/user-management.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginFormComponent,
  },
  {
    path: '',
    redirectTo: 'checkin',
    pathMatch: 'full',
  },
  {
    path: '',
    component: BoPortalLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'main',
        redirectTo: 'checkin',
        pathMatch: 'full',
      },
      {
        path: 'permissions',
        component: PermissionMatrixComponent,
      },
      {
        path: 'users',
        component: UserManagementComponent,
      },
      {
        path: 'notifications',
        component: NotificationBellComponent,
      },
      {
        path: 'checkin',
        component: CheckinLocationComponent,
      },
      {
        path: 'system-settings',
        component: SystemSettingsComponent,
      },
      {
        path: '404',
        component: Error404LayoutComponent,
      },
      {
        path: '**',
        redirectTo: '404',
      },
    ],
  },
];
