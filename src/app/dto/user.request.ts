export interface UserRequest {
    documentTypeId: number;
    profileId: number;
    documentNumber: string;
    firstName?: string;
    lastName?: string;
    username: string;
    password: string;
}
