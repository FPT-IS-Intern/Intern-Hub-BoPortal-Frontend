import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { PermissionRow } from '@/models/permission.model';
import { PermissionService } from '@/services/api/permission.service';

export const permissionGuard: (requiredPermission: string) => CanActivateFn = (requiredPermission) => {
  return () => {
    const router = inject(Router);
    const permissionService = inject(PermissionService);

    return permissionService.getPermissions('current_role').pipe(
      take(1),
      map((response) => {
        const permissions: PermissionRow[] = response.data ?? [];
        const hasPermission = permissions.some((permission) =>
          permission.function === requiredPermission && permission.view,
        );

        if (hasPermission) {
          return true;
        }

        router.navigate(['/404']);
        return false;
      }),
    );
  };
};
