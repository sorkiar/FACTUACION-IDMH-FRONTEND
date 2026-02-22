export interface SunatDocumentSummaryResponse {
    id: number;
    /** DOCUMENTO | NOTA | GUIA */
    category: string;
    documentTypeCode?: string;
    documentTypeName?: string;
    series?: string;
    sequence?: string;
    /** Serie-correlativo, ej. F001-00000001 */
    voucherNumber?: string;
    issueDate?: string;
    /** PENDIENTE | ACEPTADO | RECHAZADO | ERROR */
    status: string;
    sunatResponseCode?: number;
    sunatMessage?: string;
    hashCode?: string;
    hasXml: boolean;
    hasCdr: boolean;
    hasPdf: boolean;
    pdfUrl?: string;
    xmlUrl?: string;
    cdrUrl?: string;
    // NC / ND
    noteCode?: string;
    noteCategory?: string;
    noteTypeName?: string;
    originalVoucher?: string;
    // Guías
    transferReason?: string;
    transferDate?: string;
    transportMode?: string;
}
