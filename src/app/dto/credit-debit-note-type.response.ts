export interface CreditDebitNoteTypeResponse {
    code: string;
    name: string;
    noteCategory: 'CREDITO' | 'DEBITO';
    status: number;
}
