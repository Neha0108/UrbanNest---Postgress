import { Injectable } from '@angular/core';
import { User } from '../interface/user';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  loginUser(useremail: string, userpassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/Login`, {
      UserEmail: useremail,
      UserPassword: userpassword,
    });
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/GoogleLogin`, { idToken });
  }

  registerUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/Auth/Register`, user);
  }

  // Called by the interceptor when the access token has expired
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/RefreshToken`, { refreshToken });
  }

  storeTokens(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('role', this.decodeRoleFromToken(response.accessToken) || '');
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();

    // Best-effort server-side revoke; don't block local logout on it
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/Auth/Logout`, { refreshToken }).subscribe({
        error: () => {}, // ignore — user is logging out either way
      });
    }

    localStorage.clear();
  }

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!localStorage.getItem('accessToken');
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  updateUser(data: any) {
    return this.http.put(`${this.apiUrl}/User/update`, data);
  }

  getUserInfo() {
    return this.http.get<any>(`${this.apiUrl}/Auth/getusername`);
  }

  changePassword(data: any) {
    return this.http.put(
      `${environment.apiUrl}/Auth/ChangePass`,
      data,
      {
        responseType: 'text'
      }
    );
  }

  sendOtp(email: string) {
    return this.http.post(`${this.apiUrl}/Auth/SendOtp`, { email });
  }

  verifyOtp(data: any) {
    return this.http.post(`${this.apiUrl}/Auth/VerifyOtp`, data);
  }

  resendOtp(email: string) {
    return this.http.post(`${this.apiUrl}/Auth/ResendOtp`, { email });
  }

  private toFormData(data: Record<string, any>): FormData {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }

  getProductsByMaxPrice(price: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Products/ByMaxPrice/${price}`);
  }

  private decodeRoleFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const role =
        payload.role ??
        payload.Role ??
        payload.UserRole ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      return role ?? null;
    } catch {
      return null;
    }
  }

  getUserRole(): string | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    return this.decodeRoleFromToken(token);
  }

  getCurrentUserId(): number | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const rawId =
        payload.UserId ??
        payload.userId ??
        payload.nameid ??
        payload.sub ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

      if (rawId === undefined || rawId === null) return null;

      const id = Number(rawId);
      return isNaN(id) ? null : id;
    } catch {
      return null;
    }
  }
}