export interface CreditDebitNoteItemResponse {
    id: number;
    itemType: string;
    productId: number;
    serviceId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
}
