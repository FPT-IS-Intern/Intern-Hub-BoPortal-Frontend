import { Routes } from '@angular/router';
import { SystemSettingsComponent } from './features/system-settings/system-settings.component';
import { PermissionMatrixComponent } from './features/permission-matrix/permission-matrix.component';
import { NotificationBellComponent } from './features/notification-bell/notification-bell.component';
import { BoPortalLayoutComponent } from './layouts/main-layout/bo-portal-layout.component';
import { Error404LayoutComponent } from './layouts/error-404/error-404.component';
import { LoginFormComponent } from './features/login/login-form.component';
import { authGuard } from './core/guards/auth.guard';
import { CheckinLocationComponent } from './features/checkin-location/checkin-location.component';
import { OrgChartComponent } from './features/orgchart/orgchart.component';
import { MenuManagementComponent } from './features/menu-management/menu-management.component';
import { UserManagementComponent } from './features/user-management/user-management.component';
import { AuditLogComponent } from './features/audit-log/audit-log.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginFormComponent,
  },
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: '',
    component: BoPortalLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Kept for backward compatibility (login currently navigates to /main).
      {
        path: 'main',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'general',
        component: SystemSettingsComponent,
      },
      {
        path: 'security',
        component: SystemSettingsComponent,
      },
      {
        path: 'system-settings',
        component: SystemSettingsComponent,
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
        path: 'orgchart',
        component: OrgChartComponent,
      },
      {
        path: 'menus',
        component: MenuManagementComponent,
      },
      {
        path: 'users',
        component: UserManagementComponent,
      },
      {
        path: 'audit-log',
        component: AuditLogComponent,
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
