import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { SunatDocumentSummaryResponse } from '../dto/sunat-document-summary.response';

@Injectable({ providedIn: 'root' })
export class SunatDocumentService {

    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    listAll(status?: string): Observable<ApiResponse<SunatDocumentSummaryResponse[]>> {
        let params = new HttpParams();
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<SunatDocumentSummaryResponse[]>>(
            `${this.baseUrl}/sunat/documents`, { params }
        );
    }

    resend(doc: SunatDocumentSummaryResponse): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(`${this.entityUrl(doc)}/resend`, null);
    }

    downloadFile(doc: SunatDocumentSummaryResponse, type: 'xml' | 'cdr' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.entityUrl(doc)}/${type}`, { responseType: 'blob' });
    }

    private entityUrl(doc: SunatDocumentSummaryResponse): string {
        switch (doc.category) {
            case 'NOTA': return `${this.baseUrl}/credit-debit-notes/${doc.id}`;
            case 'GUIA': return `${this.baseUrl}/remission-guides/${doc.id}`;
            default:     return `${this.baseUrl}/documents/${doc.id}`;
        }
    }
}
