export type NoteItemType = 'PRODUCTO' | 'SERVICIO' | 'PERSONALIZADO';

export interface CreditDebitNoteItemRequest {
    itemType: NoteItemType;
    productId?: number;
    serviceId?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
}
