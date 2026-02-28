export interface SalesReportRowResponse {
    issueDate: string;
    document: string;
    client: string;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    subtotal: number;
    saleTotal: number;
}

export interface SalesReportResponse {
    companyName: string;
    dateRange: string;
    totalItems: number;
    rows: SalesReportRowResponse[];
}
