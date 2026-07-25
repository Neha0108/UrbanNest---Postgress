import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interface/product';
import { Observable } from 'rxjs';
import { Category } from '../interface/category';
import { Review } from '../interface/review';
import { Coupon, CouponCreate, CouponUpdate } from '../interface/coupon';

@Injectable({
  providedIn: 'root',
})
export class Retailer {
  private apiUrl = `${environment.apiUrl}/Retailer`;
  private orderApiUrl = `${environment.apiUrl}/Order`;
  private reviewApiUrl = `${environment.apiUrl}/Review`;

  constructor(private http: HttpClient) {}

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

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  getRetailerOrders() {
    return this.http.get<any[]>(`${this.orderApiUrl}/GetRetailerOrders`);
  }

  getProfile(): Observable<Retailer> {
    return this.http.get<Retailer>(`${this.apiUrl}/GetProfile`);
  }

  updateProfile(data: any) {
    return this.http.put(`${this.apiUrl}/UpdateProfile`, data);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  updateOrderStatus(orderId: number, status: string) {
    return this.http.put(
      `${this.orderApiUrl}/UpdateOrderStatus?orderId=${orderId}&status=${status}`,
      {},
    );
  }

  getSubCategories(categoryId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/GetSubCategory/${categoryId}`);
  }

  getRetailerCustomers() {
    return this.http.get<any[]>(`${this.apiUrl}/GetRetailerCustomers`);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  getMyReviews() {
    return this.http.get<Review[]>(`${this.reviewApiUrl}/GetMine`);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  replyToReview(reviewId: number, message: string) {
    return this.http.post(`${this.reviewApiUrl}/Reply`, { reviewId, message });
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  setDeliveryDetails(
    orderId: number,
    data: { deliveryPersonName: string; deliveryPersonPhone: string },
  ) {
    return this.http.put(`${this.orderApiUrl}/SetDeliveryDetails/${orderId}`, data);
  }
  // ── Coupons ──────────────────────────────────────────
  getMyCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.apiUrl}/GetMyCoupons`);
  }

  getCouponById(id: number): Observable<Coupon> {
    return this.http.get<Coupon>(`${this.apiUrl}/GetMyCouponById/${id}`);
  }

  createCoupon(dto: CouponCreate): Observable<Coupon> {
    return this.http.post<Coupon>(`${this.apiUrl}/CreateCoupon`, dto);
  }

  updateCoupon(id: number, dto: CouponUpdate): Observable<any> {
    return this.http.put(`${this.apiUrl}/UpdateMyCoupon/${id}`, dto);
  }

  deleteCoupon(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/DeleteMyCoupon/${id}`);
  }
}