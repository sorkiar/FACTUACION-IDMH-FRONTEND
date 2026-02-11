export interface ProductRequest {
    name: string;
    categoryId: number;
    unitMeasureId: number;
    salePrice: number;        // BigDecimal -> number
    estimatedCost?: number;   // opcional
    brand?: string;
    model?: string;
    shortDescription: string;
    technicalSpec: string;
}
