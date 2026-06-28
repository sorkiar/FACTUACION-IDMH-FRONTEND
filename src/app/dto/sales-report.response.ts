export interface SalesReportRowResponse {
    issueDate: string;
    document: string;
    documentTypeCode: string | null;
    documentTypeName: string | null;
    sunatStatus: string | null;
    client: string;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    subtotal: number;
    saleBaseAmount: number;
    saleTaxAmount: number;
    saleTotalAmount: number;
    currencyCode?: string;
}

export interface SalesReportResponse {
    companyName: string;
    dateRange: string;
    totalItems: number;
    rows: SalesReportRowResponse[];
}
