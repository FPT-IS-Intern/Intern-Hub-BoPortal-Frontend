import { Component, ChangeDetectionStrategy, inject, OnInit, ChangeDetectorRef, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleSelectorComponent } from './role-selector/role-selector.component';
import { PermissionTableComponent } from './permission-table/permission-table.component';
import { CreateRoleDialogComponent } from './create-role-dialog/create-role-dialog.component';
import { CreateResourceDialogComponent } from './create-resource-dialog/create-resource-dialog.component';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { SharedSearchComponent } from '../../components/shared-search/shared-search.component';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { AuthzService } from '../../services/api/authz.service';
import { PermissionRow } from '../../models/permission.model';
import { AuthzRole, AuthzResource, AuthzRolePermission, ResourcePermission } from '../../models/authz.model';
import { LoadingService } from '../../services/common/loading.service';
import { ToastService } from '../../services/common/toast.service';
import { finalize } from 'rxjs';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PERMISSION_COLUMNS } from '../../core/constants/permission-matrix.constants';
import { environment } from '../../../environments/environment';
import { TableSkeletonComponent } from '../../components/skeletons/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RoleSelectorComponent,
    PermissionTableComponent,
    CreateRoleDialogComponent,
    CreateResourceDialogComponent,
    NoDataComponent,
    SharedSearchComponent,
    ConfirmPopup,
    TranslateModule,
    TableSkeletonComponent,
  ],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
})
export class PermissionMatrixComponent implements OnInit {
  private readonly authzService = inject(AuthzService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly loadingService = inject(LoadingService);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  // Core signals
  protected readonly isInitLoading = signal(false);
  protected readonly isError = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly roles = signal<AuthzRole[]>([]);
  protected readonly allResources = signal<AuthzResource[]>([]);
  protected readonly selectedRoleId = signal<string | null>(null);
  protected readonly permissionRows = signal<PermissionRow[]>([]);

  protected readonly isEmpty = computed(() => {
    return !this.isInitLoading() && !this.isError() && (this.roles().length === 0 || this.allResources().length === 0);
  });

  protected readonly permissionColumns = PERMISSION_COLUMNS;
  protected isLoading = false;
  protected isConfirmVisible = false;
  protected isCreateRoleVisible = false;
  protected isCreateResourceVisible = false;

  // Filtered rows for the table
  protected readonly filteredRows = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const rows = this.permissionRows();
    if (!query) return rows;
    return rows.filter(row =>
      row.function.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    // Set immediate initial breadcrumb to clear any stale state
    const initialTitle = this.translateService.instant('permissionMatrix.breadcrumb.title');
    this.updateBreadcrumbs(initialTitle);

    // Subscribe to translation changes
    this.translateService.stream('permissionMatrix.breadcrumb.title')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(title => this.updateBreadcrumbs(title));

    this.fetchInitialData();
  }

  private updateBreadcrumbs(title: string): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: title, active: true }
    ]);
  }

  protected fetchInitialData(): void {
    this.isInitLoading.set(true);
    this.isError.set(false);
    this.loadingService.show();

    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending <= 0) {
        this.isInitLoading.set(false);
        this.cdr.markForCheck();
      }
    };

    this.authzService
      .getAllResources()
      .pipe(finalize(done))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.allResources.set(res.data);
            this.buildPermissionRows();
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Load resources error:', err);
          this.isError.set(true);
          this.cdr.markForCheck();
        },
      });

    this.authzService
      .getRoles()
      .pipe(finalize(done))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.roles.set(res.data);
            if (res.data.length > 0 && this.selectedRoleId() == null) {
              this.selectedRoleId.set(res.data[0].id);
              this.loadPermissions();
            }
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Load roles error:', err);
          this.isError.set(true);
          this.cdr.markForCheck();
        },
      });
  }

  protected loadResources(): void {
    this.authzService.getAllResources().subscribe({
      next: (res) => {
        if (res.data) {
          this.allResources.set(res.data);
          this.buildPermissionRows();
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Load resources error:', err);
        this.isError.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  protected loadRoles(): void {
    this.authzService.getRoles().subscribe({
      next: (res) => {
        if (res.data) {
          this.roles.set(res.data);
          if (res.data.length > 0 && this.selectedRoleId() == null) {
            this.selectedRoleId.set(res.data[0].id);
            this.loadPermissions();
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Load roles error:', err);
        this.isError.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  protected onRoleChange(roleId: string | null): void {
    this.selectedRoleId.set(roleId);
    if (roleId != null) {
      this.loadPermissions();
    } else {
      this.buildPermissionRows();
      this.cdr.markForCheck();
    }
  }


  protected loadPermissions(): void {
    const roleId = this.selectedRoleId();
    if (roleId == null) return;

    this.isLoading = true;
    this.loadingService.show();
    this.cdr.markForCheck();

    this.cdr.markForCheck();
    this.authzService
      .getRolePermissions(roleId)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.buildPermissionRows(res.data);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Load permissions error:', err);
          if (this.permissionRows().length === 0) {
            this.isError.set(true);
          }
          this.cdr.markForCheck();
        },
      });
  }

  private buildPermissionRows(rolePermissions: AuthzRolePermission[] = []): void {
    const permMap = new Map<string, string[]>();
    for (const p of rolePermissions) {
      if (p.resource && p.resource.id) {
        permMap.set(String(p.resource.id), p.permissions ?? []);
      }
    }

    const rows = this.allResources().map((resource) => {
      const actions = permMap.get(String(resource.id)) ?? [];
      return {
        resourceId: resource.id,
        function: resource.name,
        create: actions.includes('create'),
        view: actions.includes('read'),
        update: actions.includes('update'),
        delete: actions.includes('delete'),
        approve: actions.includes('review'),
        approver: false,
        crudTask: false,
      };
    });
    this.permissionRows.set(rows);
  }

  protected onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }


  protected onSubmit(): void {
    if (this.selectedRoleId() == null) {
      this.toastService.warningKey('toast.rbac.selectRoleRequired', 'toast.system');
      return;
    }
    this.isConfirmVisible = true;
  }

  protected handleConfirmSave(): void {
    const roleId = this.selectedRoleId();
    if (roleId == null) {
      this.isConfirmVisible = false;
      return;
    }

    const resources: ResourcePermission[] = this.permissionRows()
      .filter(row => row.resourceId != null)
      .map(row => ({
        id: row.resourceId!,
        permissions: [
          row.create ? 1 : 0,
          row.view ? 1 : 0,
          row.update ? 1 : 0,
          row.delete ? 1 : 0,
          row.approve ? 1 : 0,
        ],
      }));

    if (resources.length === 0) {
      this.toastService.warningKey('toast.rbac.noResourceToUpdate', 'toast.system');
      this.isConfirmVisible = false;
      this.cdr.markForCheck();
      return;
    }

    this.isConfirmVisible = false;
    this.isLoading = true;
    this.cdr.markForCheck();

    this.authzService
      .updateRolePermissions(roleId, resources)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.toastService.successKey('toast.rbac.updatePermissionsSuccess', 'toast.system');
          this.loadPermissions();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Update permissions error:', err);
          this.cdr.markForCheck();
        },
      });
  }

  protected handleConfirmCancel(): void {
    this.isConfirmVisible = false;
  }

  protected onCreateRole(event: { name: string; description: string }): void {
    this.authzService.createRole(event.name, event.description).subscribe({
      next: () => {
        this.toastService.successKey('toast.rbac.createRoleSuccess', 'toast.system');
        this.isCreateRoleVisible = false;
        this.loadRoles();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Create role error:', err);
        this.cdr.markForCheck();
      },
    });
  }

  protected onCreateResource(event: { name: string; code: string; description: string }): void {
    this.authzService.createResource(event.name, event.code, event.description).subscribe({
      next: (res) => {
        this.toastService.successKey('toast.rbac.createResourceSuccess', 'toast.system');
        this.isCreateResourceVisible = false;
        this.loadResources();
        if (this.selectedRoleId != null) {
          this.loadPermissions();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Create resource error:', err);
        this.cdr.markForCheck();
      },
    });
  }
}
