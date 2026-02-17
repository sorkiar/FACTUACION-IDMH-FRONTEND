export interface SaleItemResponse {
    id: number;
    itemType: string;
    productId: number
    serviceId: number
    discountPercentage: number
    description: string;
    quantity: number;
    unitPrice: number;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
}
