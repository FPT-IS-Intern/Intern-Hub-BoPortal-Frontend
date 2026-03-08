import { Routes } from '@angular/router';
import { GeneralConfigComponent } from './features/general-config/main-config/general-config.component';
import { SecurityConfigComponent } from './features/security-config/security-config.component';
import { PermissionMatrixComponent } from './features/permission-matrix/permission-matrix.component';
import { NotificationBellComponent } from './features/notification-bell/notification-bell.component';
import { BoPortalLayoutComponent } from './layouts/main-layout/bo-portal-layout.component';
import { Error404LayoutComponent } from './layouts/error-404/error-404.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'general',
    pathMatch: 'full',
  },
  {
    path: '',
    component: BoPortalLayoutComponent,
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
