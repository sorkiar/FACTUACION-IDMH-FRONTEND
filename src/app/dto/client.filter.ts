export type ClientFilter = {
    id?: number;
    status?: number; // 1 = activo, 0 = inactivo
    documentTypeId?: number;
    documentNumber?: string;
};