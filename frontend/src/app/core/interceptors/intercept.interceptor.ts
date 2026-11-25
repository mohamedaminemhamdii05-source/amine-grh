import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const interceptInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const token = localStorage.getItem('token');

  const request = token ? req.clone({
    setHeaders: {
      authorization: 'Bearer ' + token
    }
  }) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // expired or invalid login (not a wrong password on the login page): go back to login
      if (error.status === 401 && !req.url.endsWith('/signin')) {
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );

};
