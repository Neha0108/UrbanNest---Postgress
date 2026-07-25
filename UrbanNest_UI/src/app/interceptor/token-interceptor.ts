import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { UserService } from '../service/user-service';

// Module-level state (shared across all requests going through this interceptor)
// so that if 5 requests fail at once, we only call /RefreshToken ONCE, not 5 times.
let isRefreshing = false;
const refreshedAccessToken$ = new BehaviorSubject<string | null>(null);

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const router = inject(Router);

  let token: string | null = null;

  if (typeof window !== 'undefined') {
    token = userService.getAccessToken();
  }

  // Never attach an expired access token to the refresh call itself — avoids a loop
  const isRefreshCall = req.url.includes('/Auth/RefreshToken');

  const authReq = token && !isRefreshCall
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only attempt refresh on 401, and never for the login/refresh endpoints themselves
      const isAuthEndpoint =
        req.url.includes('/Auth/Login') ||
        req.url.includes('/Auth/RefreshToken') ||
        req.url.includes('/Auth/GoogleLogin');

      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      const refreshToken = userService.getRefreshToken();

      if (!refreshToken) {
        forceLogout(router);
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshedAccessToken$.next(null);

        return userService.refreshToken(refreshToken).pipe(
          switchMap((response) => {
            isRefreshing = false;
            userService.storeTokens(response);
            refreshedAccessToken$.next(response.accessToken);

            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            forceLogout(router);
            return throwError(() => refreshError);
          })
        );
      }

      // A refresh is already in-flight — wait for it to finish, then retry with the new token
      return refreshedAccessToken$.pipe(
        filter((newToken) => newToken !== null),
        take(1),
        switchMap((newToken) => {
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retryReq);
        })
      );
    })
  );
};

function forceLogout(router: Router): void {
  localStorage.clear();
  router.navigateByUrl('/login', { replaceUrl: true });
}