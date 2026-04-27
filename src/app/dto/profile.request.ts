export interface ProfileRequest {
    name: string;
    status: number;
}

export interface ProfileStatusRequest {
    status: number;
}

export interface ProfileMenuRequest {
    menuIds: number[];
}
