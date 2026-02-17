export interface SalePaymentRequest {
    paymentMethodId: number;
    amountPaid: number;
    paymentReference?: string;
    proofKey?: string; // generado dinámicamente
}
