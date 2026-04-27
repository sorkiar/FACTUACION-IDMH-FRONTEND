import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { ProfileResponse } from '../dto/profile.response';
import { ProfileRequest, ProfileStatusRequest, ProfileMenuRequest } from '../dto/profile.request';
import { MenuResponse } from '../dto/menu.response';

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private readonly baseUrl = `${environment.apiUrl}/profiles`;

    constructor(private http: HttpClient) {}

    getAll(filters?: { name?: string; status?: number }): Observable<ApiResponse<ProfileResponse[]>> {
        let params = new HttpParams();
        if (filters?.name) params = params.set('name', filters.name);
        if (filters?.status !== undefined) params = params.set('status', filters.status);
        return this.http.get<ApiResponse<ProfileResponse[]>>(this.baseUrl, { params });
    }

    findById(id: number): Observable<ApiResponse<ProfileResponse>> {
        return this.http.get<ApiResponse<ProfileResponse>>(`${this.baseUrl}/${id}`);
    }

    create(request: ProfileRequest): Observable<ApiResponse<ProfileResponse>> {
        return this.http.post<ApiResponse<ProfileResponse>>(this.baseUrl, request);
    }

    update(id: number, request: ProfileRequest): Observable<ApiResponse<ProfileResponse>> {
        return this.http.put<ApiResponse<ProfileResponse>>(`${this.baseUrl}/${id}`, request);
    }

    updateStatus(id: number, request: ProfileStatusRequest): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, request);
    }

    getMenus(id: number): Observable<ApiResponse<MenuResponse[]>> {
        return this.http.get<ApiResponse<MenuResponse[]>>(`${this.baseUrl}/${id}/menus`);
    }

    updateMenus(id: number, request: ProfileMenuRequest): Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.baseUrl}/${id}/menus`, request);
    }
}
