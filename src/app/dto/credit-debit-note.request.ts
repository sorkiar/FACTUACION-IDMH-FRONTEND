import { CreditDebitNoteItemRequest } from './credit-debit-note-item.request';

export interface CreditDebitNoteRequest {
    saleId: number;
    originalDocumentId: number;
    noteTypeCode: string;
    reason: string;
    documentSeriesId: number;
    items: CreditDebitNoteItemRequest[];
}
