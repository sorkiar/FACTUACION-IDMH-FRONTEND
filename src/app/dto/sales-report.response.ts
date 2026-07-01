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
    exchangeRate: number | null;
    itemBaseAmount: number;
    itemTaxAmount: number;
    itemTotalAmount: number;
    currencyCode?: string;
}

export interface SalesReportResponse {
    companyName: string;
    dateRange: string;
    totalItems: number;
    rows: SalesReportRowResponse[];
}
