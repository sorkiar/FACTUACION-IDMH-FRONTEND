import { SaleItemResponse } from './sale-item.response';
import { SalePaymentResponse } from './sale-payment.response';
import { DocumentResponse } from './document.response';
import { ClientResponse } from './client.response';

export interface SaleResponse {
    id: number;
    saleStatus: string;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    documentSeries?: string;
    documentSequence?: string;
    client: ClientResponse;
    items: SaleItemResponse[];
    payments?: SalePaymentResponse[];
    document?: DocumentResponse;
}
