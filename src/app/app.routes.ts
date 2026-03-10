import { Routes } from '@angular/router';
import { GeneralConfigComponent } from './features/general-config/main-config/general-config.component';
import { SecurityConfigComponent } from './features/security-config/security-config.component';
import { PermissionMatrixComponent } from './features/permission-matrix/permission-matrix.component';
import { NotificationBellComponent } from './features/notification-bell/notification-bell.component';
import { BoPortalPageComponent } from './features/bo-portal-page/bo-portal-page.component';
import { BoPortalLayoutComponent } from './layouts/main-layout/bo-portal-layout.component';
import { Error404LayoutComponent } from './layouts/error-404/error-404.component';
import { LoginFormComponent } from './features/login/login-form.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

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
        path: 'main',
        component: BoPortalPageComponent,
      },
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
        canActivate: [permissionGuard('Ma trận phân quyền')],
      },
      {
        path: 'notifications',
        component: NotificationBellComponent,
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
