import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { SunatDocumentTypeResponse } from '../dto/sunat-document-type.response';

@Injectable({ providedIn: 'root' })
export class SunatDocumentTypeService {

    private readonly baseUrl = `${environment.apiUrl}/sunat-document-types`;

    constructor(private http: HttpClient) {}

    getAll(filters?: { showInSalesReport?: boolean; status?: number }): Observable<ApiResponse<SunatDocumentTypeResponse[]>> {
        let params = new HttpParams();
        if (filters?.showInSalesReport !== undefined) params = params.set('showInSalesReport', String(filters.showInSalesReport));
        if (filters?.status !== undefined) params = params.set('status', String(filters.status));
        return this.http.get<ApiResponse<SunatDocumentTypeResponse[]>>(this.baseUrl, { params });
    }
}
