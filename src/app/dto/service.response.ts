export interface ServiceResponse {
    id: number;
    sku: string;
    name: string;
    serviceCategoryId: number;
    serviceCategoryName: string;
    chargeUnitId: number;
    chargeUnitName: string;
    detractionId?: number;
    detractionCode?: string;
    detractionDescription?: string;
    detractionPercentage?: number;
    pricePen?: number;
    priceUsd?: number;
    estimatedTime: string;
    expectedDelivery: string;
    requiresMaterials: boolean;
    requiresSpecification: boolean;
    includesDescription: string;
    excludesDescription: string;
    conditions: string;
    shortDescription: string;
    detailedDescription: string;
    imageUrl: string;
    technicalSheetUrl: string;
    status: number;
    registrationDate?: string;
}
