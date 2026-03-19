export interface ProductRequest {
    name: string;
    categoryId: number;
    unitMeasureId: number;
    salePricePen?: number;
    estimatedCostPen?: number;
    salePriceUsd?: number;
    estimatedCostUsd?: number;
    brand?: string;
    model?: string;
    shortDescription: string;
    technicalSpec: string;
}
