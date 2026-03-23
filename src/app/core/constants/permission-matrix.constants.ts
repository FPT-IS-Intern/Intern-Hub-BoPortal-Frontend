import { PermissionColumn } from '@/models/permission.model';

export const PERMISSION_COLUMNS: readonly PermissionColumn[] = [
  { key: 'create', label: 'permissionMatrix.table.actions.create' },
  { key: 'view', label: 'permissionMatrix.table.actions.view' },
  { key: 'update', label: 'permissionMatrix.table.actions.update' },
  { key: 'delete', label: 'permissionMatrix.table.actions.delete' },
  { key: 'approve', label: 'permissionMatrix.table.actions.approve' },
] as const;
