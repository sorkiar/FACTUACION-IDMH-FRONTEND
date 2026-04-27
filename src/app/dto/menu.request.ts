export interface MenuRequest {
    name: string;
    path?: string;
    parentId?: number;
    sortOrder: number;
    menuType?: string;
}

export interface MenuStatusRequest {
    status: number;
}
