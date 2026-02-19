import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../dto/api-response.response';
import { DocumentSeriesResponse } from '../dto/document-series.response';

@Injectable({
    providedIn: 'root',
})
export class DocumentSeriesService {

    private readonly baseUrl = `${environment.apiUrl}/document-series`;

    constructor(private http: HttpClient) { }

    // ============================================================
    // GET NEXT SEQUENCE PREVIEW
    // ============================================================
    getNextSequence(documentTypeCode: string):
        Observable<ApiResponse<DocumentSeriesResponse>> {

        let params = new HttpParams()
            .set('documentTypeCode', documentTypeCode);

        return this.http.get<ApiResponse<DocumentSeriesResponse>>(
            `${this.baseUrl}/next-sequence`,
            { params }
        );
    }

    getNextSequenceById(seriesId: number):
        Observable<ApiResponse<DocumentSeriesResponse>> {

        let params = new HttpParams()
            .set('seriesId', seriesId);

        return this.http.get<ApiResponse<DocumentSeriesResponse>>(
            `${this.baseUrl}/next-sequence`,
            { params }
        );
    }
}
