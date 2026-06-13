import { Injectable } from '@angular/core';
import { User } from '../interface/user';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';
import { Product } from '../interface/product';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  loginUser(useremail: string, userpassword: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/Auth/Login`,
      {
        UserEmail: useremail,
        UserPassword: userpassword
      }
    );
  }

  registerUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/Auth/Register`, user,);
  }

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!localStorage.getItem('token');
  }

  updateUser(data: any) {
    return this.http.put(`${this.apiUrl}/User/update`, data);
  }

  getUserInfo() {
    return this.http.get<any>(`${this.apiUrl}/Auth/getusername`);
  }

  changePassword(data: FormData | Record<string, any>) {
    const body = data instanceof FormData ? data : this.toFormData(data);
    return this.http.put(`${this.apiUrl}/Auth/ChangePass`, body, { responseType: 'text' });
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

  getProductsByPrice(maxPrice: number, categoryId?: number) {
  let params: any = {
    maxPrice: maxPrice
  };

  if (categoryId) {
    params.categoryId = categoryId;
  }

  return this.http.get<Product[]>(
    `${this.apiUrl}/GetProductsByPrice`,
    { params }
  );
}
}
