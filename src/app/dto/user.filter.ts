export type UserFilter = {
    id?: number;
    username?: string;
    documentTypeId?: number;
    documentNumber?: string;
    status?: number; // 1 activo, 0 inactivo
};
