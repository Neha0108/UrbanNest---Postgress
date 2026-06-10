
import { Component, signal } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { Navbar } from "./LandingPage/navbar/navbar";
import { ConsumerNavbar } from './components/consumer/consumer-navbar/consumer-navbar';
import { RetailerNavbar } from './components/retailer/retailerNavbar/navbar';
import { CommonModule } from '@angular/common';
import { AdminComponent }  from "./components/admin/admin";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConsumerNavbar, RetailerNavbar, CommonModule, AdminComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('UrbanNest');

  getUserRole(): 'Consumer' | 'Retailer' | 'Admin' | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (
        payload.role ||
        payload.Role ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        null
      );
    } catch {
      return null;
    }
  }
}