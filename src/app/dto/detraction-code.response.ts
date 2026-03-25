export interface DetractionCodeResponse {
    id: number;
    code: string;
    description: string;
    percentage: number;
    minAmount?: number;
    category: string;
    status: number;
}
