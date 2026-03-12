import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { SunatSendConfigResponse } from '../dto/sunat-send-config.response';

export interface OfflineIntervals {
    boleta: number;
    factura: number;
    notaCredito: number;
    notaDebito: number;
    guiaRemision: number;
}

@Injectable({ providedIn: 'root' })
export class SunatSendConfigService {

    private readonly url = `${environment.apiUrl}/sunat-send-config`;

    constructor(private http: HttpClient) {}

    getConfig(): Observable<ApiResponse<SunatSendConfigResponse>> {
        return this.http.get<ApiResponse<SunatSendConfigResponse>>(this.url);
    }

    updateConfig(modo: 'ONLINE' | 'OFFLINE', intervals?: OfflineIntervals): Observable<ApiResponse<SunatSendConfigResponse>> {
        const doc = (key: keyof OfflineIntervals) =>
            intervals ? { modo, intervaloMinutos: intervals[key] } : { modo };
        const body = {
            boleta:       doc('boleta'),
            factura:      doc('factura'),
            notaCredito:  doc('notaCredito'),
            notaDebito:   doc('notaDebito'),
            guiaRemision: doc('guiaRemision'),
        };
        return this.http.put<ApiResponse<SunatSendConfigResponse>>(this.url, body);
    }
}
