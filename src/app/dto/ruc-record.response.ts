export interface RucRecordResponse {
    ruc: string;
    name: string;
    state: string;
    condition: string;
    address: string;
    fullAddress: string;
    department: string;
    province: string;
    district: string;
    ubigeoSunat: string;
    ubigeoDept: string;
    ubigeoProv: string;
    ubigeoDist: string;
    isRetentionAgent: boolean;
    isPerceptionAgent: boolean;
    isPerceptionFuelAgent: boolean;
    isGoodTaxpayer: boolean;
    createdAt: string;
    updatedAt: string;
}
