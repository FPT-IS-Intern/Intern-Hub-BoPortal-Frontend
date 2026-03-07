export interface PermissionRow {
    function: string;
    create: boolean;
    view: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
    approver: boolean;
    crudTask: boolean;
    [key: string]: string | boolean; // Allow string indexing for easier binding
}

export interface PermissionMatrixResponse {
    role: string;
    permissions: PermissionRow[];
}
