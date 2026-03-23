import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { DetractionCodeResponse } from '../dto/detraction-code.response';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DetractionCodeService {
    private readonly baseUrl = `${environment.apiUrl}/detraction-codes`;

    constructor(private http: HttpClient) { }

    getAll(filters?: { code?: string; category?: string; status?: number }): Observable<ApiResponse<DetractionCodeResponse[]>> {
        let params = new HttpParams();
        if (filters?.code) params = params.set('code', filters.code);
        if (filters?.category) params = params.set('category', filters.category);
        if (filters?.status !== undefined) params = params.set('status', filters.status);
        return this.http.get<ApiResponse<DetractionCodeResponse[]>>(this.baseUrl, { params });
    }
}
