import { SaleItemRequest } from './sale-item.request';
import { SalePaymentRequest } from './sale-payment.request';

export interface SaleRequest {
    clientId: number;
    items: SaleItemRequest[];
    payments?: SalePaymentRequest[];
    draft?: boolean;
    documentTypeCode?: string;
    documentSeriesId?: number;
}
