export interface MenuRequest {
    name: string;
    path?: string;
    parentId?: number;
    sortOrder: number;
}

export interface MenuStatusRequest {
    status: number;
}
