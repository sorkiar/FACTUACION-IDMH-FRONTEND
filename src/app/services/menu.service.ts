import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { MenuResponse } from '../dto/menu.response';
import { MenuRequest, MenuStatusRequest } from '../dto/menu.request';
import { SidebarItemResponse } from '../dto/sidebar-item.response';

@Injectable({ providedIn: 'root' })
export class MenuService {
    private readonly baseUrl = `${environment.apiUrl}/menus`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<ApiResponse<MenuResponse[]>> {
        return this.http.get<ApiResponse<MenuResponse[]>>(this.baseUrl);
    }

    getSidebar(): Observable<ApiResponse<SidebarItemResponse[]>> {
        return this.http.get<ApiResponse<SidebarItemResponse[]>>(`${this.baseUrl}/sidebar`);
    }

    findById(id: number): Observable<ApiResponse<MenuResponse>> {
        return this.http.get<ApiResponse<MenuResponse>>(`${this.baseUrl}/${id}`);
    }

    create(request: MenuRequest): Observable<ApiResponse<MenuResponse>> {
        return this.http.post<ApiResponse<MenuResponse>>(this.baseUrl, request);
    }

    update(id: number, request: MenuRequest): Observable<ApiResponse<MenuResponse>> {
        return this.http.put<ApiResponse<MenuResponse>>(`${this.baseUrl}/${id}`, request);
    }

    updateStatus(id: number, request: MenuStatusRequest): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, request);
    }
}
