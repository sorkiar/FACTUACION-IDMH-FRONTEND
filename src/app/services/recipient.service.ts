import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { RecipientResponse } from '../dto/recipient.response';
import { RecipientRequest } from '../dto/recipient.request';

@Injectable({
    providedIn: 'root',
})
export class RecipientService {
    private readonly baseUrl = `${environment.apiUrl}/recipients`;

    constructor(private http: HttpClient) { }

    getAll(filters?: { status?: number }): Observable<ApiResponse<RecipientResponse[]>> {
        let params = new HttpParams();
        if (filters?.status !== undefined) params = params.set('status', filters.status);
        return this.http.get<ApiResponse<RecipientResponse[]>>(this.baseUrl, { params });
    }

    create(request: RecipientRequest): Observable<ApiResponse<RecipientResponse>> {
        return this.http.post<ApiResponse<RecipientResponse>>(this.baseUrl, request);
    }

    update(id: number, request: RecipientRequest): Observable<ApiResponse<RecipientResponse>> {
        return this.http.put<ApiResponse<RecipientResponse>>(`${this.baseUrl}/${id}`, request);
    }

    updateStatus(id: number, status: number): Observable<ApiResponse<number>> {
        return this.http.patch<ApiResponse<number>>(`${this.baseUrl}/${id}/status`, { status });
    }
}
