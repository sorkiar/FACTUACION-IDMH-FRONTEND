import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { UnitMeasureResponse } from '../dto/unit-measure.response';
import { UnitMeasureFilter } from '../dto/unit-measure.filter';

@Injectable({
    providedIn: 'root',
})
export class UnitMeasureService {
    private readonly baseUrl = `${environment.apiUrl}/unit-measures`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/unit-measures
     * filtro opcional: status
     */
    getAll(filters?: UnitMeasureFilter): Observable<ApiResponse<UnitMeasureResponse[]>> {
        let params = new HttpParams();

        if (filters?.status !== undefined) {
            params = params.set('status', filters.status);
        }

        return this.http.get<ApiResponse<UnitMeasureResponse[]>>(this.baseUrl, { params });
    }
}
