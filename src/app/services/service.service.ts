import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ServiceResponse } from '../dto/service.response';
import { ServiceRequest } from '../dto/service.request';
import { ServiceFilter } from '../dto/service.filter';

@Injectable({
    providedIn: 'root',
})
export class ServiceService {
    private readonly baseUrl = `${environment.apiUrl}/services`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/services
     * filtros: id, status, serviceCategoryId, sku, name
     */
    getAll(filters?: ServiceFilter): Observable<ApiResponse<ServiceResponse[]>> {
        let params = new HttpParams();

        if (filters?.id !== undefined) params = params.set('id', filters.id);
        if (filters?.status !== undefined) params = params.set('status', filters.status);
        if (filters?.serviceCategoryId !== undefined) params = params.set('serviceCategoryId', filters.serviceCategoryId);
        if (filters?.sku) params = params.set('sku', filters.sku);
        if (filters?.name) params = params.set('name', filters.name);

        return this.http.get<ApiResponse<ServiceResponse[]>>(this.baseUrl, { params });
    }

    /**
     * POST /api/services (multipart/form-data)
     * - data: JSON string
     * - image: File (opcional)
     * - technicalSheet: File (opcional)
     */
    create(
        request: ServiceRequest,
        image?: File,
        technicalSheet?: File
    ): Observable<ApiResponse<ServiceResponse>> {
        const formData = this.buildFormData(request, image, technicalSheet);
        return this.http.post<ApiResponse<ServiceResponse>>(this.baseUrl, formData);
    }

    /**
     * PUT /api/services/{id} (multipart/form-data)
     * - data: JSON string
     * - image: File (opcional)
     * - technicalSheet: File (opcional)
     */
    update(
        id: number,
        request: ServiceRequest,
        image?: File,
        technicalSheet?: File
    ): Observable<ApiResponse<ServiceResponse>> {
        const formData = this.buildFormData(request, image, technicalSheet);
        return this.http.put<ApiResponse<ServiceResponse>>(`${this.baseUrl}/${id}`, formData);
    }

    /**
     * PATCH /api/services/{id}/status
     * body: { status: 1 | 0 }
     */
    updateStatus(id: number, status: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, { status });
    }

    /**
     * GET /api/services/{id}/pdf
     * Retorna el PDF como Blob
     */
    getPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
    }

    // ============================================================
    // Helpers
    // ============================================================
    private buildFormData(
        request: ServiceRequest,
        image?: File,
        technicalSheet?: File
    ): FormData {
        const formData = new FormData();
        formData.append('data', JSON.stringify(request));

        // Nombres EXACTOS según tu controller:
        if (image) formData.append('image', image);
        if (technicalSheet) formData.append('technicalSheet', technicalSheet);

        return formData;
    }
}
