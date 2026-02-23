import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { UbigeoResponse } from '../dto/ubigeo.response';

@Injectable({ providedIn: 'root' })
export class UbigeoService {

    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    listActive(): Observable<ApiResponse<UbigeoResponse[]>> {
        return this.http.get<ApiResponse<UbigeoResponse[]>>(
            `${this.baseUrl}/ubigeos`, { params: { status: '1' } }
        );
    }
}
