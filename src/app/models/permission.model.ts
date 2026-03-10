export interface PermissionRow {
    resourceId?: string;
    function: string;
    create: boolean;
    view: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
    approver: boolean;
    crudTask: boolean;
    [key: string]: string | boolean | number | undefined;
}

export interface PermissionMatrixResponse {
    role: string;
    permissions: PermissionRow[];
}
