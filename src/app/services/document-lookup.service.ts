import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { DniRecordResponse } from '../dto/dni-record.response';
import { RucRecordResponse } from '../dto/ruc-record.response';

@Injectable({ providedIn: 'root' })
export class DocumentLookupService {
    private readonly baseUrl = `${environment.apiUrl}/document-lookup`;

    constructor(private http: HttpClient) { }

    queryDni(dni: string): Observable<ApiResponse<DniRecordResponse>> {
        return this.http.get<ApiResponse<DniRecordResponse>>(`${this.baseUrl}/dni/${dni}`);
    }

    queryRuc(ruc: string): Observable<ApiResponse<RucRecordResponse>> {
        return this.http.get<ApiResponse<RucRecordResponse>>(`${this.baseUrl}/ruc/${ruc}`);
    }
}
