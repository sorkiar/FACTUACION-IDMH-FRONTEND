import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { DriverResponse } from '../dto/driver.response';
import { DriverRequest } from '../dto/driver.request';
import { DriverVehicleResponse } from '../dto/driver-vehicle.response';

@Injectable({ providedIn: 'root' })
export class DriverService {
    private readonly baseUrl = `${environment.apiUrl}/drivers`;

    constructor(private http: HttpClient) { }

    getAll(filters?: { id?: number; status?: number }): Observable<ApiResponse<DriverResponse[]>> {
        let params = new HttpParams();
        if (filters?.id != null) params = params.set('id', filters.id);
        if (filters?.status != null) params = params.set('status', filters.status);
        return this.http.get<ApiResponse<DriverResponse[]>>(this.baseUrl, { params });
    }

    findById(id: number): Observable<ApiResponse<DriverResponse>> {
        return this.http.get<ApiResponse<DriverResponse>>(`${this.baseUrl}/${id}`);
    }

    create(request: DriverRequest): Observable<ApiResponse<DriverResponse>> {
        return this.http.post<ApiResponse<DriverResponse>>(this.baseUrl, request);
    }

    update(id: number, request: DriverRequest): Observable<ApiResponse<DriverResponse>> {
        return this.http.put<ApiResponse<DriverResponse>>(`${this.baseUrl}/${id}`, request);
    }

    updateStatus(id: number, status: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, { status });
    }

    addVehicle(driverId: number, plate: string): Observable<ApiResponse<DriverVehicleResponse>> {
        return this.http.post<ApiResponse<DriverVehicleResponse>>(
            `${this.baseUrl}/${driverId}/vehicles`, { plate }
        );
    }

    updateVehicle(driverId: number, vehicleId: number, plate: string): Observable<ApiResponse<DriverVehicleResponse>> {
        return this.http.put<ApiResponse<DriverVehicleResponse>>(
            `${this.baseUrl}/${driverId}/vehicles/${vehicleId}`, { plate }
        );
    }

    deleteVehicle(driverId: number, vehicleId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(
            `${this.baseUrl}/${driverId}/vehicles/${vehicleId}`
        );
    }
}
