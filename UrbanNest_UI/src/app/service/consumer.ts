import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interface/product';
import { Category } from '../interface/category';
import { CartItem } from '../interface/cart-item';
import { ConsumerProfile } from '../interface/consumer-profile';
import { Address } from '../interface/address';
import { RatingSummary, Review } from '../interface/review';

@Injectable({
  providedIn: 'root',
})
export class Consumer {
  private apiUrl = `${environment.apiUrl}/Consumer`;
  private orderApiUrl = `${environment.apiUrl}/Order`;
  private reviewApiUrl = `${environment.apiUrl}/Review`;

  constructor(private http: HttpClient) {}

  allProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/GetAllForUsers`);
  }

  getProductById(productId: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/getProductbyId/${productId}`);
  }

  getCategories() {
    return this.http.get<Category[]>(`${this.apiUrl}/getCategory`);
  }

  getWishlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetWishlist`);
  }

  addToWishlist(productId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/AddToWishlist/${productId}`, {});
  }

  removeFromWishlist(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/RemoveFromWishlist/${productId}`);
  }

  addToCart(productId: number, quantity: number) {
    return this.http.post(
      `${this.apiUrl}/AddToCart`,
      { productId, quantity },
      { responseType: 'text' },
    );
  }

  getCartItems(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.apiUrl}/GetCart`);
  }

  updateQuantity(productId: number, quantity: number) {
    return this.http.put(`${this.apiUrl}/UpdateQuantity`, {
      productId,
      quantity,
    });
  }

  removeFromCart(productId: number) {
    return this.http.delete(`${this.apiUrl}/RemoveFromCart/${productId}`);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  placeOrder(body: any) {
    return this.http.post(`${this.orderApiUrl}/PlaceOrder`, body);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  getUserOrders() {
    return this.http.get<any[]>(`${this.orderApiUrl}/GetUserOrders`);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getProfile`);
  }

  EditProfile(formData: FormData): Observable<ConsumerProfile> {
    return this.http.put<ConsumerProfile>(`${this.apiUrl}/EditProfile`, formData);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  cancelOrder(orderId: number) {
    return this.http.put(`${this.orderApiUrl}/CancelOrder?orderId=${orderId}`, {});
  }

  getAddresses() {
    return this.http.get<Address[]>(`${this.apiUrl}/GetMyAddresses`);
  }

  addAddress(data: Address) {
    return this.http.post(`${this.apiUrl}/addAddress`, data);
  }

  deleteAddress(id: number) {
    return this.http.delete(`${this.apiUrl}/deleteAddress/${id}`);
  }

  updateAddress(id: number, address: Address) {
    return this.http.put(
      `${this.apiUrl}/EditAddress/${id}`,
      address
    );
  }

  payment(amount: number) {
    return this.http.post(`${this.apiUrl}/CreateOrder`, { amount: amount });
  }

  verifyPayment(body: any) {
    return this.http.post(`${this.apiUrl}/VerifyPayment`, body);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  addReview(productId: number, rating: number, comment: string) {
    return this.http.post(`${this.reviewApiUrl}/Add`, { productId, rating, comment });
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  getProductReviews(productId: number) {
    return this.http.get<Review[]>(`${this.reviewApiUrl}/GetByProduct/${productId}`);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  getRatingSummary(productId: number): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.reviewApiUrl}/GetSummary/${productId}`);
  }

  // FIXED: Now uses environment.apiUrl instead of hardcoded URL
  toggleHelpful(reviewId: number) {
    return this.http.post<{ message: string; helpfulCount: number }>(`${this.reviewApiUrl}/Helpful/${reviewId}`, {});
  }

  getactiveCoupons() {
    return this.http.get<any[]>(`${environment.apiUrl}/Coupon`);
  }

  applyCoupon(couponCode: string) {
    return this.http.post(`${environment.apiUrl}/Coupon/Apply`, { couponCode });
  }
}