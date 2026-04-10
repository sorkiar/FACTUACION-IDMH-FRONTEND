import { DriverVehicleResponse } from './driver-vehicle.response';

export interface DriverResponse {
    id: number;
    docType: string;
    docNumber: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    status: number;
    vehicles?: DriverVehicleResponse[];
}
