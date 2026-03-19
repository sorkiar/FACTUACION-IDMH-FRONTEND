import { SaleItemRequest } from './sale-item.request';
import { SalePaymentRequest } from './sale-payment.request';
import { SaleInstallmentRequest } from './sale-installment.request';

export interface SaleRequest {
    clientId: number;
    items: SaleItemRequest[];
    currencyCode?: string;
    paymentType?: string;
    purchaseOrder?: string;
    observations?: string;
    relatedGuides?: string[];
    payments?: SalePaymentRequest[];
    installments?: SaleInstallmentRequest[];
    draft?: boolean;
    documentTypeCode?: string;
    documentSeriesId?: number;
}
