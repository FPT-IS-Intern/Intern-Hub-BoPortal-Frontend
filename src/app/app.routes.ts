import { Routes } from '@angular/router';
import { GeneralConfigComponent } from './features/general-config/main-config/general-config.component';
import { SecurityConfigComponent } from './features/security-config/security-config.component';
import { PermissionMatrixComponent } from './features/permission-matrix/permission-matrix.component';
import { NotificationBellComponent } from './features/notification-bell/notification-bell.component';
import { BoPortalLayoutComponent } from './layouts/main-layout/bo-portal-layout.component';
import { Error404LayoutComponent } from './layouts/error-404/error-404.component';
import { LoginFormComponent } from './features/login/login-form.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { CheckinLocationComponent } from './features/checkin-location/checkin-location.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginFormComponent,
  },
  {
    path: '',
    redirectTo: 'main',
    pathMatch: 'full',
  },
  {
    path: '',
    component: BoPortalLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'general',
        component: GeneralConfigComponent,
      },
      {
        path: 'security',
        component: SecurityConfigComponent,
      },
      {
        path: 'permissions',
        component: PermissionMatrixComponent,
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
