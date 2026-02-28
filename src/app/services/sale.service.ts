import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../dto/api-response.response';
import { SaleResponse } from '../dto/sale.response';
import { SaleRequest } from '../dto/sale.request';
import { SaleFilter } from '../dto/sale-filter.filter';

@Injectable({
    providedIn: 'root',
})
export class SaleService {

    private readonly baseUrl = `${environment.apiUrl}/sales`;

    constructor(private http: HttpClient) { }

    // ============================================================
    // LIST SALES WITH FILTERS
    // ============================================================
    getAll(filter?: SaleFilter): Observable<ApiResponse<SaleResponse[]>> {

        let params = new HttpParams();

        if (filter) {
            if (filter.id) params = params.set('id', filter.id);
            if (filter.clientId) params = params.set('clientId', filter.clientId);
            if (filter.saleStatus) params = params.set('saleStatus', filter.saleStatus);
            if (filter.paymentStatus) params = params.set('paymentStatus', filter.paymentStatus);
            if (filter.startDate) params = params.set('startDate', filter.startDate);
            if (filter.endDate) params = params.set('endDate', filter.endDate);
        }

        return this.http.get<ApiResponse<SaleResponse[]>>(
            this.baseUrl,
            { params }
        );
    }

    // ============================================================
    // CREATE SALE
    // ============================================================
    create(
        request: SaleRequest,
        paymentFiles?: { proofKey: string; file: File }[]
    ): Observable<ApiResponse<SaleResponse>> {

        const formData = this.buildFormData(request, paymentFiles);

        return this.http.post<ApiResponse<SaleResponse>>(
            this.baseUrl,
            formData
        );
    }

    // ============================================================
    // UPDATE DRAFT
    // ============================================================
    updateDraft(
        id: number,
        request: SaleRequest,
        paymentFiles?: { proofKey: string; file: File }[]
    ): Observable<ApiResponse<SaleResponse>> {

        const formData = this.buildFormData(request, paymentFiles);

        return this.http.put<ApiResponse<SaleResponse>>(
            `${this.baseUrl}/${id}/draft`,
            formData
        );
    }

    // ============================================================
    // GENERATE QUOTATION PDF
    // ============================================================
    generateQuotation(request: SaleRequest): Observable<Blob> {
        return this.http.post(`${this.baseUrl}/quotation`, request, { responseType: 'blob' });
    }

    // ============================================================
    // PRIVATE: BUILD FORM DATA
    // ============================================================
    private buildFormData(
        request: SaleRequest,
        paymentFiles?: { proofKey: string; file: File }[]
    ): FormData {

        const formData = new FormData();

        // Adjuntar JSON como string
        formData.append('data', JSON.stringify(request));

        // Adjuntar archivos dinámicos
        if (paymentFiles && paymentFiles.length > 0) {
            paymentFiles.forEach(p => {
                formData.append(p.proofKey, p.file);
            });
        }

        return formData;
    }
}
