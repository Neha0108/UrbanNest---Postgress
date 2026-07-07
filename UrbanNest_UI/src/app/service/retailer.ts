import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interface/product';
import { Observable } from 'rxjs';
import { Category } from '../interface/category';
import { Review } from '../interface/review';

@Injectable({
  providedIn: 'root',
})
export class Retailer {

  private apiUrl = `${environment.apiUrl}/Retailer`;

  constructor(private http: HttpClient) { }

  getMyProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/Get`);
  }

  addProduct(formData: FormData): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/add`, formData);
  }

  getCategories() {
    return this.http.get<Category[]>(`${this.apiUrl}/getCategory`);
  }

  updateProduct(id: number, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/Update/${id}`, formData);
  }

  getById(productId: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/getbyId/${productId}`);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }

  getRetailerOrders() {
    return this.http.get<any[]>('http://localhost:5146/api/Order/GetRetailerOrders');
  }

  getProfile(): Observable<Retailer> {
    return this.http.get<Retailer>(`${this.apiUrl}/GetProfile`);
  }

  updateProfile(data: any) {
    return this.http.put(`${this.apiUrl}/UpdateProfile`, data);
  }

  updateOrderStatus(orderId: number, status: string) {
    return this.http.put(
      `http://localhost:5146/api/Order/UpdateOrderStatus?orderId=${orderId}&status=${status}`,
      {}
    );
  }

  getSubCategories(categoryId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/GetSubCategory/${categoryId}`);
  }

  getRetailerCustomers() {
    return this.http.get<any[]>(`${this.apiUrl}/GetRetailerCustomers`);
  }

  getMyReviews() {
    return this.http.get<Review[]>(`http://localhost:5146/api/Review/GetMine`);
  }

  replyToReview(reviewId: number, message: string) {
    return this.http.post(`http://localhost:5146/api/Review/Reply`, { reviewId, message });
  }
}