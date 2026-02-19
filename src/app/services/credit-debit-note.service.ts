import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { CreditDebitNoteResponse } from '../dto/credit-debit-note.response';
import { CreditDebitNoteRequest } from '../dto/credit-debit-note.request';
import { CreditDebitNoteFilter } from '../dto/credit-debit-note.filter';

@Injectable({ providedIn: 'root' })
export class CreditDebitNoteService {
    private readonly baseUrl = `${environment.apiUrl}/credit-debit-notes`;

    constructor(private http: HttpClient) { }

    getAll(filters?: CreditDebitNoteFilter): Observable<ApiResponse<CreditDebitNoteResponse[]>> {
        let params = new HttpParams();
        if (filters?.id !== undefined) params = params.set('id', filters.id);
        if (filters?.saleId !== undefined) params = params.set('saleId', filters.saleId);
        if (filters?.documentTypeCode) params = params.set('documentTypeCode', filters.documentTypeCode);
        if (filters?.status) params = params.set('status', filters.status);
        if (filters?.startDate) params = params.set('startDate', filters.startDate);
        if (filters?.endDate) params = params.set('endDate', filters.endDate);
        return this.http.get<ApiResponse<CreditDebitNoteResponse[]>>(this.baseUrl, { params });
    }

    getById(id: number): Observable<ApiResponse<CreditDebitNoteResponse>> {
        return this.http.get<ApiResponse<CreditDebitNoteResponse>>(`${this.baseUrl}/${id}`);
    }

    create(request: CreditDebitNoteRequest): Observable<ApiResponse<CreditDebitNoteResponse>> {
        return this.http.post<ApiResponse<CreditDebitNoteResponse>>(this.baseUrl, request);
    }

    resend(id: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${id}/resend`, {});
    }
}
