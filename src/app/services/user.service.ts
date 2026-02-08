import { environment } from './../../environments/environment.dev';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { UserResponse } from '../dto/user.response';
import { UserRequest } from '../dto/user.request';
import { UserFilter } from '../dto/user.filter';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private readonly baseUrl = `${environment.apiUrl}/users`;

    constructor(private http: HttpClient) { }

    /**
     * GET /api/users
     * filtros opcionales: id, username, documentTypeId, documentNumber, status
     */
    getAll(filters?: UserFilter): Observable<ApiResponse<UserResponse[]>> {
        let params = new HttpParams();

        if (filters?.id !== undefined) params = params.set('id', filters.id);
        if (filters?.username) params = params.set('username', filters.username);
        if (filters?.documentTypeId !== undefined) params = params.set('documentTypeId', filters.documentTypeId);
        if (filters?.documentNumber) params = params.set('documentNumber', filters.documentNumber);
        if (filters?.status !== undefined) params = params.set('status', filters.status);

        return this.http.get<ApiResponse<UserResponse[]>>(this.baseUrl, { params });
    }

    /**
     * PUT /api/users/{id}
     */
    update(id: number, request: UserRequest): Observable<ApiResponse<UserResponse>> {
        return this.http.put<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`, request);
    }

    /**
     * PATCH /api/users/{id}/status
     * body: { status: 1 | 0 }
     */
    updateStatus(id: number, status: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, { status });
    }
}
