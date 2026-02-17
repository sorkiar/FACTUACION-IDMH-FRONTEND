export interface DocumentResponse {
    id: number;
    series: string;
    sequence: string;
    issueDate: string; // viene como ISO string
    status: string;
    sunatResponseCode?: number;
    sunatMessage?: string;
    pdfUrl?: string;
}
