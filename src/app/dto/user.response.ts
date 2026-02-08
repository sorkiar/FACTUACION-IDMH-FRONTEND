export interface UserResponse {
    id: number;
    documentTypeId: number;
    documentTypeName: string;
    profileId: number;
    profileName: string;
    documentNumber: string;
    firstName?: string;
    lastName?: string;
    username: string;
    status: number;
}
