import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  private baseUrl = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) {}

  getConsumers() {
    return this.http.get(`${this.baseUrl}/consumers`);
  }

  getRetailers() {
    return this.http.get(`${this.baseUrl}/retailers`);
  }

  blockUser(id: number) {
    return this.http.put(`${this.baseUrl}/block/${id}`, {});
  }

  getCategories() {
    return this.http.get(`${this.baseUrl}/getCategories`);
  }

  addCategory(data: any) {
    return this.http.post(`${this.baseUrl}/addCategory`, data);
  }

  deleteCategory(id: number) {
    return this.http.delete(`${this.baseUrl}/deleteCategory/${id}`);
  }
}