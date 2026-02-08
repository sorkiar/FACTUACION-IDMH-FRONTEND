import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ChargeUnitResponse } from '../dto/charge-unit.response';
import { ChargeUnitFilter } from '../dto/charge-unit.filter';

@Injectable({
    providedIn: 'root',
})
export class ChargeUnitService {
    private readonly baseUrl = `${environment.apiUrl}/charge-units`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/charge-units
     * filtro opcional: status
     */
    getAll(filters?: ChargeUnitFilter): Observable<ApiResponse<ChargeUnitResponse[]>> {
        let params = new HttpParams();

        if (filters?.status !== undefined) {
            params = params.set('status', filters.status);
        }

        return this.http.get<ApiResponse<ChargeUnitResponse[]>>(this.baseUrl, { params });
    }
}
