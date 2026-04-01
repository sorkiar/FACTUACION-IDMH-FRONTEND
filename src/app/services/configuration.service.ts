import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ConfigurationResponse } from '../dto/configuration.response';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
    private readonly baseUrl = `${environment.apiUrl}/configurations`;

    constructor(private http: HttpClient) { }

    findEditable(): Observable<ApiResponse<ConfigurationResponse[]>> {
        return this.http.get<ApiResponse<ConfigurationResponse[]>>(this.baseUrl);
    }

    update(id: number, configValue: string, editable: number): Observable<ApiResponse<ConfigurationResponse>> {
        return this.http.put<ApiResponse<ConfigurationResponse>>(`${this.baseUrl}/${id}`, {
            configValue,
            editable
        });
    }
}
