import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interface/product';
import { Category } from '../interface/category';
import { CartItem } from '../interface/cart-item';
import { ConsumerProfile } from '../interface/consumer-profile';
import { Address } from '../interface/address';

@Injectable({
  providedIn: 'root',
})
export class Consumer {

  private apiUrl = `${environment.apiUrl}/Consumer`;

  constructor(private http: HttpClient) { }

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

  addToCart(productId: number) {
    return this.http.post(
      `${this.apiUrl}/AddToCart`,
      { productId, quantity: 1 },
      { responseType: 'text' }
    );
  }

  getCartItems(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.apiUrl}/GetCart`);
  }


  updateQuantity(productId: number, quantity: number) {
    return this.http.put(`${this.apiUrl}/UpdateQuantity`, {
      productId,
      quantity
    });
  }

  removeFromCart(productId: number) {
    return this.http.delete(`${this.apiUrl}/RemoveFromCart/${productId}`);
  }

  placeOrder(body: any) {
    return this.http.post('http://localhost:5146/api/Order/PlaceOrder', body);
  }

  getUserOrders() {
    return this.http.get<any[]>(
      'http://localhost:5146/api/Order/GetUserOrders'
    );
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getProfile`);
  }

  EditProfile(formData: FormData): Observable<ConsumerProfile> {
    return this.http.put<ConsumerProfile>(`${this.apiUrl}/EditProfile`, formData);
  }

  cancelOrder(orderId: number) {
    return this.http.put(
      `http://localhost:5146/api/Order/CancelOrder?orderId=${orderId}`,
      {}
    );
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

  payment(amount:number) {
    return this.http.post(`${this.apiUrl}/CreateOrder`, { amount: amount });
  }
  
  verifyPayment(body: any) {
    return this.http.post(`${this.apiUrl}/VerifyPayment`, body);
  }
}