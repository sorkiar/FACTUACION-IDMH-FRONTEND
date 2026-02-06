import { environment } from './../../environments/environment.dev';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ClientResponse } from '../dto/client.response';
import { ClientRequest } from '../dto/client.request';
import { ClientFilter } from '../dto/client.filter';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private readonly baseUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) { }

  /**
   * GET /api/clients
   * Filtros opcionales: id, status, documentTypeId, documentNumber
   */
  getAll(filters?: ClientFilter): Observable<ApiResponse<ClientResponse[]>> {
    let params = new HttpParams();

    if (filters?.id !== undefined) params = params.set('id', filters.id);
    if (filters?.status !== undefined) params = params.set('status', filters.status);
    if (filters?.documentTypeId !== undefined) params = params.set('documentTypeId', filters.documentTypeId);
    if (filters?.documentNumber) params = params.set('documentNumber', filters.documentNumber);

    return this.http.get<ApiResponse<ClientResponse[]>>(this.baseUrl, { params });
  }

  /**
   * POST /api/clients
   */
  create(request: ClientRequest): Observable<ApiResponse<ClientResponse>> {
    return this.http.post<ApiResponse<ClientResponse>>(this.baseUrl, request);
  }

  /**
   * PUT /api/clients/{id}
   */
  update(id: number, request: ClientRequest): Observable<ApiResponse<ClientResponse>> {
    return this.http.put<ApiResponse<ClientResponse>>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * PATCH /api/clients/{id}/status
   * Body: { status: 1 | 0 }
   */
  updateStatus(id: number, status: number): Observable<ApiResponse<number>> {
    return this.http.patch<ApiResponse<number>>(`${this.baseUrl}/${id}/status`, { status });
  }
}
