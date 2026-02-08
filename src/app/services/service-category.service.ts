import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ServiceCategoryResponse } from '../dto/service-category.response';
import { ServiceCategoryFilter } from '../dto/service-category.filter';

@Injectable({
    providedIn: 'root',
})
export class ServiceCategoryService {
    private readonly baseUrl = `${environment.apiUrl}/service-categories`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/service-categories
     * filtro opcional: status
     */
    getAll(filters?: ServiceCategoryFilter): Observable<ApiResponse<ServiceCategoryResponse[]>> {
        let params = new HttpParams();

        if (filters?.status !== undefined) {
            params = params.set('status', filters.status);
        }

        return this.http.get<ApiResponse<ServiceCategoryResponse[]>>(this.baseUrl, { params });
    }
}
