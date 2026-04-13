import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.response';
import { ClientResponse } from '../dto/client.response';
import { ClientRequest } from '../dto/client.request';
import { ClientFilter } from '../dto/client.filter';
import { ClientAddressResponse } from '../dto/client-address.response';
import { ClientAddressRequest } from '../dto/client-address.request';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private readonly baseUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) { }

  getAll(filters?: ClientFilter): Observable<ApiResponse<ClientResponse[]>> {
    let params = new HttpParams();
    if (filters?.id !== undefined) params = params.set('id', filters.id);
    if (filters?.status !== undefined) params = params.set('status', filters.status);
    if (filters?.documentTypeId !== undefined) params = params.set('documentTypeId', filters.documentTypeId);
    if (filters?.documentNumber) params = params.set('documentNumber', filters.documentNumber);
    return this.http.get<ApiResponse<ClientResponse[]>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<ClientResponse>> {
    return this.http.get<ApiResponse<ClientResponse>>(`${this.baseUrl}/${id}`);
  }

  create(request: ClientRequest): Observable<ApiResponse<ClientResponse>> {
    return this.http.post<ApiResponse<ClientResponse>>(this.baseUrl, request);
  }

  update(id: number, request: ClientRequest): Observable<ApiResponse<ClientResponse>> {
    return this.http.put<ApiResponse<ClientResponse>>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, status: number): Observable<ApiResponse<number>> {
    return this.http.patch<ApiResponse<number>>(`${this.baseUrl}/${id}/status`, { status });
  }

  // ─── Address sub-resource ────────────────────────────────────────────────

  addAddress(clientId: number, req: ClientAddressRequest): Observable<ApiResponse<ClientAddressResponse>> {
    return this.http.post<ApiResponse<ClientAddressResponse>>(`${this.baseUrl}/${clientId}/addresses`, req);
  }

  updateAddress(clientId: number, addressId: number, req: ClientAddressRequest): Observable<ApiResponse<ClientAddressResponse>> {
    return this.http.put<ApiResponse<ClientAddressResponse>>(`${this.baseUrl}/${clientId}/addresses/${addressId}`, req);
  }

  deleteAddress(clientId: number, addressId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${clientId}/addresses/${addressId}`);
  }
}
