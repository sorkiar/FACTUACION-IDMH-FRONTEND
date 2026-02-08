import { environment } from './../../environments/environment.dev';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { PersonTypeResponse } from '../dto/person-type.response';
import { PersonTypeFilter } from '../dto/person-type.filter';

@Injectable({
    providedIn: 'root',
})
export class PersonTypeService {
    private readonly baseUrl = `${environment.apiUrl}/person-types`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/person-types
     * filtro opcional: status
     */
    getAll(filters?: PersonTypeFilter): Observable<ApiResponse<PersonTypeResponse[]>> {
        let params = new HttpParams();

        if (filters?.status !== undefined) {
            params = params.set('status', filters.status);
        }

        return this.http.get<ApiResponse<PersonTypeResponse[]>>(this.baseUrl, { params });
    }
}
