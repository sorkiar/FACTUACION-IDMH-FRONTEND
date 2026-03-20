export interface RecipientResponse {
    id: number;
    docType: string;
    docNumber: string;
    name: string;
    address?: string;
    ubigeoCode?: string;
    status: number;
}
