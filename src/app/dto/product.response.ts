export interface ProductResponse {
    id: number;
    sku: string;
    name: string;
    categoryId: number;
    categoryName: string;
    unitMeasureId: number;
    unitMeasureCode: string;
    salePrice: number;        // BigDecimal -> number
    estimatedCost?: number;    // BigDecimal -> number (si a veces viene null, cámbialo a estimatedCost?: number)
    brand?: string;
    model?: string;
    shortDescription: string;
    technicalSpec: string;
    mainImageUrl: string;
    technicalSheetUrl?: string;
    status: number;           // Integer -> number
}
