import { PaymentMethodResponse } from "./payment-method.response";

export interface SalePaymentResponse {
    id: number;
    paymentMethodId: number;
    paymentMethodName?: string;
    amountPaid: number;
    paymentReference?: string;
    proofFileUrl?: string;
    paymentMethod?: PaymentMethodResponse;
}
