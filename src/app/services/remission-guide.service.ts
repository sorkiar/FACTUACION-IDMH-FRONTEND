import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { RemissionGuideResponse } from '../dto/remission-guide.response';
import { RemissionGuideRequest } from '../dto/remission-guide.request';
import { RemissionGuideFilter } from '../dto/remission-guide.filter';

@Injectable({ providedIn: 'root' })
export class RemissionGuideService {
    private readonly baseUrl = `${environment.apiUrl}/remission-guides`;

    constructor(private http: HttpClient) { }

    getAll(filter?: RemissionGuideFilter): Observable<ApiResponse<RemissionGuideResponse[]>> {
        let params = new HttpParams();
        if (filter?.id !== undefined) params = params.set('id', filter.id);
        if (filter?.series) params = params.set('series', filter.series);
        if (filter?.status) params = params.set('status', filter.status);
        if (filter?.transferReason) params = params.set('transferReason', filter.transferReason);
        if (filter?.transportMode) params = params.set('transportMode', filter.transportMode);
        if (filter?.startDate) params = params.set('startDate', filter.startDate);
        if (filter?.endDate) params = params.set('endDate', filter.endDate);
        return this.http.get<ApiResponse<RemissionGuideResponse[]>>(this.baseUrl, { params });
    }

    getById(id: number): Observable<ApiResponse<RemissionGuideResponse>> {
        return this.http.get<ApiResponse<RemissionGuideResponse>>(`${this.baseUrl}/${id}`);
    }

    create(request: RemissionGuideRequest): Observable<ApiResponse<RemissionGuideResponse>> {
        return this.http.post<ApiResponse<RemissionGuideResponse>>(this.baseUrl, request);
    }
}
