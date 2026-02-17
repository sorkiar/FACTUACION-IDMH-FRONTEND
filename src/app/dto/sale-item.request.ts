export type SaleItemType = 'PRODUCTO' | 'SERVICIO' | 'PERSONALIZADO';

export interface SaleItemRequest {
    itemType: SaleItemType;

    productId?: number;
    serviceId?: number;

    description: string;

    quantity: number;
    unitPrice: number;

    discountPercentage?: number;
}
