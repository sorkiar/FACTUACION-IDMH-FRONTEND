export interface RemissionGuideItemResponse {
    id: number;
    productId?: number;
    description: string;
    quantity: number;
    unitMeasureSunat?: string;
    unitPrice: number;
    subtotalAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
}
