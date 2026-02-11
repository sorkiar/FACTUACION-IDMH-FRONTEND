import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';

@Injectable({
    providedIn: 'root',
})
export class SkuSequenceService {
    private readonly baseUrl = `${environment.apiUrl}/sku`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/sku/preview
     * filtro opcional: status
     */
    preview(type: string): Observable<ApiResponse<string>> {
        let params = new HttpParams();

        params = params.set('type', type);
        return this.http.get<ApiResponse<string>>(`${this.baseUrl}/preview`, { params });
    }
}
