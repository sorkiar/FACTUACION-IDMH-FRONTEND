export interface SidebarSubItemResponse {
    name: string;
    path: string;
}

export interface SidebarItemResponse {
    name: string;
    path?: string;
    subItems?: SidebarSubItemResponse[];
}
