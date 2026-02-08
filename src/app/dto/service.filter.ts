export type ServiceFilter = {
    id?: number;
    status?: number; // 1 activo, 0 inactivo
    serviceCategoryId?: number;
    sku?: string;
    name?: string;
};
