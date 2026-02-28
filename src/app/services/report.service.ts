import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { SalesReportResponse } from '../dto/sales-report.response';

@Injectable({ providedIn: 'root' })
export class ReportService {

    private readonly baseUrl = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) {}

    /**
     * GET /api/reports/sales
     * startDate y endDate requeridos (YYYY-MM-DD)
     * clientIds y productIds opcionales (ej: "1,2,3")
     */
    getSalesReport(
        startDate: string,
        endDate: string,
        clientIds?: string,
        productIds?: string
    ): Observable<ApiResponse<SalesReportResponse>> {
        let params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        if (clientIds) params = params.set('clientIds', clientIds);
        if (productIds) params = params.set('productIds', productIds);

        return this.http.get<ApiResponse<SalesReportResponse>>(`${this.baseUrl}/sales`, { params });
    }
}
