import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { CarrierResponse } from '../dto/carrier.response';
import { CarrierRequest } from '../dto/carrier.request';

@Injectable({ providedIn: 'root' })
export class CarrierService {
    private readonly baseUrl = `${environment.apiUrl}/carriers`;

    constructor(private http: HttpClient) { }

    getAll(filters?: { id?: number; status?: number }): Observable<ApiResponse<CarrierResponse[]>> {
        let params = new HttpParams();
        if (filters?.id != null) params = params.set('id', filters.id);
        if (filters?.status != null) params = params.set('status', filters.status);
        return this.http.get<ApiResponse<CarrierResponse[]>>(this.baseUrl, { params });
    }

    create(request: CarrierRequest): Observable<ApiResponse<CarrierResponse>> {
        return this.http.post<ApiResponse<CarrierResponse>>(this.baseUrl, request);
    }

    update(id: number, request: CarrierRequest): Observable<ApiResponse<CarrierResponse>> {
        return this.http.put<ApiResponse<CarrierResponse>>(`${this.baseUrl}/${id}`, request);
    }

    updateStatus(id: number, status: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, { status });
    }
}
