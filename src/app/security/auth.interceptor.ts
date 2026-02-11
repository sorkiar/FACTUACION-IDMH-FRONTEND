import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.token;

    // (opcional) evita mandar token al login
    const isAuthEndpoint = req.url.includes('/signin');

    if (token && !isAuthEndpoint) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        });
    }

    return next(req).pipe(
        catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
                // Limpia sesión / token
                authService.logout?.();
                // o authService.clearToken(); / localStorage.removeItem('token') etc.

                // Redirige al login (y opcionalmente guarda returnUrl)
                router.navigate(['/signin']);
            }

            return throwError(() => error);
        })
    );
};
