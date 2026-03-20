import { RemissionGuideItemRequest } from './remission-guide-item.request';
import { RemissionGuideDriverRequest } from './remission-guide-driver.request';

export interface RemissionGuideRequest {
    transferDate: string;
    transferReason: string;
    transferReasonDescription?: string;
    transportMode: string;
    grossWeight: number;
    weightUnit?: string;
    packageCount?: number;
    originAddress: string;
    originUbigeo: string;
    originLocalCode?: string;
    destinationAddress: string;
    destinationUbigeo: string;
    destinationLocalCode?: string;
    minorVehicleTransfer?: boolean;
    recipientId: number;
    carrierDocType?: string;
    carrierDocNumber?: string;
    carrierName?: string;
    observations?: string;
    items: RemissionGuideItemRequest[];
    drivers?: RemissionGuideDriverRequest[];
}
