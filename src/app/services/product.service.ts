import { environment } from './../../environments/environment.dev';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ProductResponse } from '../dto/product.response';
import { ProductRequest } from '../dto/product.request';
import { ProductFilter } from '../dto/product.filter';

@Injectable({
    providedIn: 'root',
})
export class ProductService {
    private readonly baseUrl = `${environment.apiUrl}/products`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/products
     * filtros opcionales: id, status, categoryId, sku
     */
    getAll(filters?: ProductFilter): Observable<ApiResponse<ProductResponse[]>> {
        let params = new HttpParams();

        if (filters?.id !== undefined) params = params.set('id', filters.id);
        if (filters?.status !== undefined) params = params.set('status', filters.status);
        if (filters?.categoryId !== undefined) params = params.set('categoryId', filters.categoryId);
        if (filters?.sku) params = params.set('sku', filters.sku);

        return this.http.get<ApiResponse<ProductResponse[]>>(this.baseUrl, { params });
    }

    /**
     * POST /api/products (multipart/form-data)
     * Partes:
     * - data: JSON string
     * - mainImage: File (obligatorio)
     * - technicalSheet: File (opcional)
     */
    create(
        request: ProductRequest,
        mainImage: File,
        technicalSheet?: File
    ): Observable<ApiResponse<ProductResponse>> {
        const formData = this.buildFormData(request, mainImage, technicalSheet);
        return this.http.post<ApiResponse<ProductResponse>>(this.baseUrl, formData);
    }

    /**
     * PUT /api/products/{id} (multipart/form-data)
     * Partes:
     * - data: JSON string
     * - mainImage: File (opcional)
     * - technicalSheet: File (opcional)
     */
    update(
        id: number,
        request: ProductRequest,
        mainImage?: File,
        technicalSheet?: File
    ): Observable<ApiResponse<ProductResponse>> {
        const formData = this.buildFormData(request, mainImage, technicalSheet);
        return this.http.put<ApiResponse<ProductResponse>>(`${this.baseUrl}/${id}`, formData);
    }

    /**
     * PATCH /api/products/{id}/status
     * body: { status: 1 | 0 }
     */
    updateStatus(id: number, status: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, { status });
    }

    // ============================================================
    // Helpers
    // ============================================================
    private buildFormData(
        request: ProductRequest,
        mainImage?: File,
        technicalSheet?: File
    ): FormData {
        const formData = new FormData();

        // IMPORTANTE: el backend espera el part "data" como String JSON
        formData.append('data', JSON.stringify(request));

        if (mainImage) formData.append('mainImage', mainImage);
        if (technicalSheet) formData.append('technicalSheet', technicalSheet);

        return formData;
    }
}
