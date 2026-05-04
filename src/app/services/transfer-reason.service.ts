import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { TransferReasonResponse } from '../dto/transfer-reason.response';

@Injectable({ providedIn: 'root' })
export class TransferReasonService {
    private readonly baseUrl = `${environment.apiUrl}/transfer-reasons`;

    constructor(private http: HttpClient) {}

    getAll(filter?: { status?: number }): Observable<ApiResponse<TransferReasonResponse[]>> {
        let params = new HttpParams();
        if (filter?.status != null) params = params.set('status', filter.status);
        return this.http.get<ApiResponse<TransferReasonResponse[]>>(this.baseUrl, { params });
    }
}
