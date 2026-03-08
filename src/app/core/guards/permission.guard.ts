import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PermissionService } from '../../services/permission.service';
import { map, take } from 'rxjs';

export const permissionGuard: (requiredPermission: string) => CanActivateFn = (requiredPermission) => {
    return (route, state) => {
        const router = inject(Router);
        const permissionService = inject(PermissionService);

        // Ở đây giả định PermissionService có method checkPermission
        // Nếu chưa có, chúng ta sẽ cần bổ sung hoặc mock logic dựa trên requirements
        return permissionService.getPermissions('current_role').pipe(
            take(1),
            map(res => {
                const permissions = res.data || [];
                const hasPermission = permissions.some((p: any) => p.function === requiredPermission && p.view);
                if (hasPermission) {
                    return true;
                }
                router.navigate(['/404']);
                return false;
            })
        );
    };
};
