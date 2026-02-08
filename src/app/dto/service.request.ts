export interface ServiceRequest {
    sku: string;
    name: string;
    serviceCategoryId: number;
    chargeUnitId: number;
    price?: number;
    estimatedTime?: string;
    expectedDelivery?: string;
    includesDescription?: string;
    excludesDescription?: string;
    conditions?: string;
    requiresMaterials: boolean;
    requiresSpecification: boolean;
    shortDescription: string;
    detailedDescription: string;
}
