import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { CreditDebitNoteTypeResponse } from '../dto/credit-debit-note-type.response';

export interface CreditDebitNoteTypeFilter {
    code?: string;
    noteCategory?: 'CREDITO' | 'DEBITO';
    status?: number;
}

@Injectable({ providedIn: 'root' })
export class CreditDebitNoteTypeService {
    private readonly baseUrl = `${environment.apiUrl}/credit-debit-note-types`;

    constructor(private http: HttpClient) { }

    getAll(filters?: CreditDebitNoteTypeFilter): Observable<ApiResponse<CreditDebitNoteTypeResponse[]>> {
        let params = new HttpParams();
        if (filters?.code) params = params.set('code', filters.code);
        if (filters?.noteCategory) params = params.set('noteCategory', filters.noteCategory);
        if (filters?.status !== undefined) params = params.set('status', filters.status);
        return this.http.get<ApiResponse<CreditDebitNoteTypeResponse[]>>(this.baseUrl, { params });
    }
}
