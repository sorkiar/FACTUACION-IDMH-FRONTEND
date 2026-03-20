import { RemissionGuideItemResponse } from './remission-guide-item.response';
import { RemissionGuideDriverResponse } from './remission-guide-driver.response';
import { RecipientResponse } from './recipient.response';

export interface RemissionGuideResponse {
    id: number;
    documentSeriesId?: number;
    series?: string;
    sequence?: string;
    issueDate?: string;
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
    recipient?: RecipientResponse;
    carrierDocType?: string;
    carrierDocNumber?: string;
    carrierName?: string;
    observations?: string;
    status: string;
    sunatResponseCode?: number;
    sunatMessage?: string;
    hashCode?: string;
    xmlUrl?: string;
    cdrUrl?: string;
    pdfUrl?: string;
    items: RemissionGuideItemResponse[];
    drivers?: RemissionGuideDriverResponse[];
}
