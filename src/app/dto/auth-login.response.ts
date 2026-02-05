export interface AuthLoginResponse {
    id: number;
    documentType: string;
    documentNumber: string;
    profile: string;
    firstName: string;
    lastName: string;
    username: string;
    token: string;
    status: number;
}
