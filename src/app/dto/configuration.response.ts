export interface ConfigurationResponse {
    id: number;
    configGroup: string;
    configKey: string;
    configValue: string;
    configDatatype: string;
    description: string;
    editable: number;
    colSpan?: number;
    sortOrder?: number;
    createdAt?: string;
    updatedAt?: string;
}
