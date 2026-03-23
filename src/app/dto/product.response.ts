export interface ProductResponse {
    id: number;
    sku: string;
    name: string;
    categoryId: number;
    categoryName: string;
    unitMeasureId: number;
    unitMeasureCode: string;
    detractionId?: number;
    detractionCode?: string;
    detractionDescription?: string;
    detractionPercentage?: number;
    salePricePen?: number;
    estimatedCostPen?: number;
    salePriceUsd?: number;
    estimatedCostUsd?: number;
    brand?: string;
    model?: string;
    shortDescription: string;
    technicalSpec: string;
    mainImageUrl?: string;
    technicalSheetUrl?: string;
    status: number;
}
