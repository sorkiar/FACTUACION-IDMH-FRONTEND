import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ExchangeRateResponse } from '../dto/exchange-rate.response';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
    private readonly baseUrl = `${environment.apiUrl}/exchange-rates`;

    constructor(private http: HttpClient) { }

    getToday(): Observable<ApiResponse<ExchangeRateResponse>> {
        return this.http.get<ApiResponse<ExchangeRateResponse>>(this.baseUrl);
    }
}
