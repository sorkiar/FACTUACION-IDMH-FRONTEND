import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { CategoryResponse } from '../dto/category.response';
import { CategoryFilter } from '../dto/category.filter';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private readonly baseUrl = `${environment.apiUrl}/categories`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/categories
     * filtro opcional: status
     */
    getAll(filters?: CategoryFilter): Observable<ApiResponse<CategoryResponse[]>> {
        let params = new HttpParams();

        if (filters?.status !== undefined) {
            params = params.set('status', filters.status);
        }

        return this.http.get<ApiResponse<CategoryResponse[]>>(this.baseUrl, { params });
    }
}
