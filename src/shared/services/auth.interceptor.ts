import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth_token');
    const router = inject(Router);

    // Clone the request and add the authorization header if token exists
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error) => {
            // Si el token ha expirado o es inválido (401 Unauthorized)
            if (error.status === 401) {
                // Limpiar sesión
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                
                // Redirigir a business auth
                router.navigate(['/business-auth']);
            }
            
            return throwError(() => error);
        })
    );
};