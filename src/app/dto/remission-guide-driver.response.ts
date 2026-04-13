import { DriverResponse } from './driver.response';
import { DriverVehicleResponse } from './driver-vehicle.response';

export interface RemissionGuideDriverResponse {
    id: number;
    driver: DriverResponse;
    driverVehicle: DriverVehicleResponse;
}
