export interface DocumentSendConfig {
    modo: string;
    intervaloMinutos?: number;
}

export interface SunatSendConfigResponse {
    boleta?: DocumentSendConfig;
    factura?: DocumentSendConfig;
    notaCredito?: DocumentSendConfig;
    notaDebito?: DocumentSendConfig;
    guiaRemision?: DocumentSendConfig;
}
