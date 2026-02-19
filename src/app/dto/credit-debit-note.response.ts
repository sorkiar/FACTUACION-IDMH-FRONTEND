import { SaleResponse } from './sale.response';
import { DocumentResponse } from './document.response';
import { CreditDebitNoteTypeResponse } from './credit-debit-note-type.response';
import { CreditDebitNoteItemResponse } from './credit-debit-note-item.response';

export interface CreditDebitNoteResponse {
    id: number;
    sale: SaleResponse;
    originalDocument: DocumentResponse;
    creditDebitNoteType: CreditDebitNoteTypeResponse;
    reason: string;
    status: string;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    taxPercentage?: number;
    currencyCode?: string;
    series?: string;
    sequence?: string;
    issueDate?: string;
    sunatResponseCode?: number;
    sunatMessage?: string;
    pdfUrl?: string;
    xmlUrl?: string;
    cdrUrl?: string;
    items: CreditDebitNoteItemResponse[];
}
