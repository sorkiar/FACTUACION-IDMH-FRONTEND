import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { DashboardResponse, MonthlyRevenueResponse } from '../dto/dashboard.response';

@Injectable({ providedIn: 'root' })
export class DashboardService {

    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    get(): Observable<ApiResponse<DashboardResponse>> {
        return this.http.get<ApiResponse<DashboardResponse>>(`${this.baseUrl}/dashboard`);
    }

    getMonthlyRevenue(year: number, month: number): Observable<ApiResponse<MonthlyRevenueResponse>> {
        return this.http.get<ApiResponse<MonthlyRevenueResponse>>(
            `${this.baseUrl}/dashboard/monthly-revenue`, { params: { year, month } }
        );
    }
}
