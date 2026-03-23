import { SaleItemResponse } from './sale-item.response';
import { SalePaymentResponse } from './sale-payment.response';
import { SaleInstallmentResponse } from './sale-installment.response';
import { DocumentResponse } from './document.response';
import { ClientResponse } from './client.response';

export interface SaleResponse {
    id: number;
    saleStatus: string;
    currencyCode?: string;
    paymentType?: string;
    purchaseOrder?: string;
    observations?: string;
    relatedGuides?: string[];
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    hasRetention?: boolean;
    retentionAmount?: number;
    retentionRate?: number;
    netAmount?: number;
    hasDetraction?: boolean;
    documentSeries?: string;
    documentSequence?: string;
    client: ClientResponse;
    items: SaleItemResponse[];
    payments?: SalePaymentResponse[];
    installments?: SaleInstallmentResponse[];
    document?: DocumentResponse;
}
