export interface SaleInstallmentRequest {
    installmentNumber: number;
    dueDate: string; // ISO date YYYY-MM-DD
    amount: number;
}
