import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { ChangePassword } from './auth/change-password/change-password';
import { Userdashboard } from './components/consumer/userdashboard/userdashboard';
import { Retailerdashboard } from './components/retailer/retailerdashboard/retailerdashboard';
import { AddProduct } from './components/retailer/add-product/add-product';
import { ConsumerNavbar } from './components/consumer/consumer-navbar/consumer-navbar';
import { Wishlist } from './components/consumer/wishlist/wishlist';
import { Welcome } from './components/consumer/welcome/welcome';
import { Cart } from './components/consumer/cart/cart';
import { RetailerNavbar } from './components/retailer/retailerNavbar/navbar';
import { LoadProducts } from './components/retailer/load-products/load-products';
import { Ordersucccess } from './components/consumer/ordersucccess/ordersucccess';
import { Orders } from './components/consumer/orders/orders';
import { Profile as profile } from './components/consumer/profile/profile';
import { About } from './LandingPage/about/about';
import { Products } from './LandingPage/products/products';
import { Home } from './auth/home/home';
import { ProductDetails } from './components/consumer/product-details/product-details';
import { AdminComponent }  from './components/admin/admin';
import { Profile as retailerProfile } from './components/retailer/profile/profile';
import { Category } from './LandingPage/category/category';
import { SuggestedProducts } from './components/consumer/suggested-products/suggested-products';
import { Address } from './components/consumer/address/address';
import { ShopByPrice } from './LandingPage/shop-by-price/shop-by-price';
import { Orders as retailerOrders } from './components/retailer/orders/orders';
import { Customers } from './components/retailer/customers/customers';
import { Checkout } from './components/consumer/checkout/checkout';
import { Reviews } from './components/retailer/review/review';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { Navbar } from './LandingPage/navbar/navbar';
import { guestGuard } from './guards/guest-guard';
import { redirectGuard } from './guards/redirect-guard';
import { Coupons } from './components/retailer/coupons/coupons';
import { Offers } from './components/consumer/offers/offers';

export const routes: Routes = [
  {
  path: '',
  component: Navbar,
  canActivate: [redirectGuard],
  children: [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    { path: 'home', component: Home },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'register', component: Register, canActivate: [guestGuard] },
    { path: 'about', component: About },
    { path: 'products', component: Products },
    { path: 'category', component: Category },
    { path: 'shop-by-price', component: ShopByPrice },
    { path: 'product-details/:id', component: ProductDetails },
  ]
},
  {
    path: 'consumerNavbar',
    component: ConsumerNavbar,
    canActivate: [authGuard, roleGuard(['Consumer'])],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'userdashboard', component: Userdashboard },
      { path: 'wishlist', component: Wishlist },
      { path: 'cart', component: Cart },
      { path: 'orders', component: Orders },
      { path: 'order', component: Ordersucccess },
      { path: 'profile', component: profile },
      { path: 'change-password', component: ChangePassword },
      { path: 'product-details/:id', component: ProductDetails },
      { path: 'suggested-products', component: SuggestedProducts },
      { path: 'address', component: Address },
      { path: 'checkout', component: Checkout },
      { path: 'offers', component: Offers }
    ]
  },

  {
    path: 'retailerNavbar',
    component: RetailerNavbar,
    canActivate: [authGuard, roleGuard(['Retailer'])],
    children: [
      { path: '', redirectTo: 'retailerdashboard', pathMatch: 'full' },
      { path: 'retailerdashboard', component: Retailerdashboard },
      { path: 'products', component: LoadProducts },
      { path: 'add-product', component: AddProduct },
      { path: 'edit-product/:id', component: AddProduct },
      { path: 'retailer-profile', component: retailerProfile },
      { path: 'change-password', component: ChangePassword },
      { path: 'retailerOrders', component: retailerOrders },
      { path: 'customers', component: Customers },
      { path: 'reviews', component: Reviews },
      { path: 'coupons', component: Coupons }
    ]
  },

  { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard(['Admin']) ] }

];
