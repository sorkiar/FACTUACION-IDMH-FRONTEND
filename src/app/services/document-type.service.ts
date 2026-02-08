import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentTypeResponse } from '../dto/document-type.response';
import { ApiResponse } from '../dto/api-response.response';

@Injectable({
  providedIn: 'root',
})
export class DocumentTypeService {

  private readonly baseUrl = `${environment.apiUrl}/document-types`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene tipos de documento
   * @param status (opcional) 1 = activo, 0 = inactivo
   */
  getAll(status?: number, personTypeId?: number): Observable<ApiResponse<DocumentTypeResponse[]>> {
    let params = new HttpParams();

    if (status !== undefined) {
      params = params.set('status', status);
    }

    if (personTypeId !== undefined) {
      params = params.set('personTypeId', personTypeId);
    }

    return this.http.get<ApiResponse<DocumentTypeResponse[]>>(this.baseUrl, {
      params,
    });
  }
}
