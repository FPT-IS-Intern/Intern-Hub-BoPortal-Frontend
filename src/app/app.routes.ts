import { Routes } from '@angular/router';
import { BoPortalLayoutComponent } from '@/layouts/main-layout/bo-portal-layout.component';
import { Error404LayoutComponent } from '@/layouts/error-404/error-404.component';
import { authGuard } from '@/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@/features/login/login-form.component').then((m) => m.LoginFormComponent),
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
      {
        path: 'main',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        loadComponent: () => import('@/features/user-management/user-management.component').then((m) => m.UserManagementComponent),
      },
      {
        path: 'permissions',
        loadComponent: () => import('@/features/permission-matrix/permission-matrix.component').then((m) => m.PermissionMatrixComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('@/features/notification-bell/notification-bell.component').then((m) => m.NotificationBellComponent),
      },
      {
        path: 'checkin',
        loadComponent: () => import('@/features/checkin-location/checkin-location.component').then((m) => m.CheckinLocationComponent),
      },
      {
        path: 'menus',
        loadComponent: () => import('@/features/menu-management/menu-management.component').then((m) => m.MenuManagementComponent),
      },
      {
        path: 'system-settings',
        loadComponent: () => import('@/features/system-settings/system-settings.component').then((m) => m.SystemSettingsComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () => import('@/features/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
      },
      {
        path: '',
        component: Error404LayoutComponent,
      },
      {
        path: '**',
        redirectTo: '404',
      },
    ],
  },
];
