import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthRegisterRequest } from '../dto/auth-register.request';
import { AuthRegisterResponse } from '../dto/auth-register.response';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../dto/api-response.response';
import { AuthLoginRequest } from '../dto/auth-login.request';
import { AuthLoginResponse } from '../dto/auth-login.response';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly baseUrl = `${environment.apiUrl}/auth`;
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    constructor(private http: HttpClient) { }

    login(
        request: AuthLoginRequest
    ): Observable<ApiResponse<AuthLoginResponse>> {
        return this.http
            .post<ApiResponse<AuthLoginResponse>>(
                `${this.baseUrl}/login`,
                request
            )
            .pipe(
                tap((res) => {
                    localStorage.setItem(this.TOKEN_KEY, res.data.token);
                    localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
                })
            );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    get token(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    register(
        request: AuthRegisterRequest
    ): Observable<ApiResponse<AuthRegisterResponse>> {
        return this.http.post<ApiResponse<AuthRegisterResponse>>(
            `${this.baseUrl}/register`,
            request
        );
    }

    get user(): AuthLoginResponse | null {
        const raw = localStorage.getItem(this.USER_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    get userName(): string {
        const user = this.user;
        return user ? `${user.firstName} ${user.lastName}` : '';
    }
}
