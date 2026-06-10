import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Retailer } from '../../../service/retailer';
import { CommonModule, DatePipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import gsap from 'gsap';

@Component({
  selector: 'app-retailerdashboard',
  imports: [CommonModule, DatePipe],
  templateUrl: './retailerdashboard.html',
  styleUrl: './retailerdashboard.css',
})
export class Retailerdashboard implements OnInit {

  orders: any[] = [];
  totalRevenue = 0;
  totalOrders = 0;
  totalQuantity = 0;
  heroProduct = '';
  frequentProduct = '';

  private chng = inject(ChangeDetectorRef);

  constructor(private retailerService: Retailer) { }

  ngOnInit(): void {
    this.loadOrders();

  }

  loadOrders() {
    this.retailerService.getRetailerOrders().subscribe({
      next: res => {
        this.orders = res;
        this.calculateAnalytics();
        setTimeout(() => {
          this.createRevenueChart();

          gsap.from(".card", {
            opacity: 0,
            y: 40,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out"
          });

        }, 0);
        setTimeout(() => {
          this.createRevenueChart();
          this.createCategoryChart();   // ✅ ADD THIS

          gsap.from(".card", {
            opacity: 0,
            y: 40,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out"
          });

        }, 0);

        this.chng.detectChanges();
        console.log(this.orders);
      },
      error: err => console.error(err)
    });
  }

  calculateAnalytics() {
    let revenue = 0;
    let qty = 0;

    const productMap: any = {};

    this.orders.forEach(order => {
      order.Items.forEach((item: any) => {
        revenue += item.Price * item.Quantity;
        qty += item.Quantity;

        // count product frequency
        productMap[item.ProductName] =
          (productMap[item.ProductName] || 0) + item.Quantity;
      });
    });

    this.totalRevenue = revenue;
    this.totalOrders = this.orders.length;
    this.totalQuantity = qty;

    // find top product
    this.heroProduct = Object.keys(productMap).reduce((a, b) =>
      productMap[a] > productMap[b] ? a : b
    );
  }


  createRevenueChart() {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(212,175,55,0.4)');
    gradient.addColorStop(1, 'rgba(212,175,55,0.05)');

    const monthlyMap: any = {};

    this.orders.forEach(order => {
      const date = new Date(order.OrderDate);
      const month = date.toLocaleString('default', { month: 'short' });

      let orderTotal = 0;

      order.Items.forEach((item: any) => {
        orderTotal += item.Price * item.Quantity;
      });

      monthlyMap[month] = (monthlyMap[month] || 0) + orderTotal;
    });

    const labels = Object.keys(monthlyMap);
    const data = Object.values(monthlyMap);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#D4AF37',
          backgroundColor: gradient,
          borderWidth: 2,
          tension: 0.45,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#aaa' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#aaa' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  }

  createCategoryChart() {

    const canvas = document.getElementById('categoryChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const categoryMap: any = {};

    this.orders.forEach(order => {
      order.Items.forEach((item: any) => {

        const category = item.CategoryName || 'Other';

        categoryMap[category] =
          (categoryMap[category] || 0) + item.Quantity;

      });
    });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    new Chart(canvas, {
      type: 'doughnut',   // 🔥 looks premium
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            '#D4AF37',
            '#3498db',
            '#e67e22',
            '#9b59b6',
            '#2ecc71',
            '#e74c3c'
          ],
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#555' }
          }
        }
      }
    });
  }


  updateStatus(orderId: number, event: any) {
    const status = event.target.value;

    this.retailerService.updateOrderStatus(orderId, status).subscribe({
      next: (res: any) => {
        const order = this.orders.find(o => o.OrderId === orderId);
        if (order) order.Status = status;

        console.log(res.message);
      },
      error: err => {
        console.error(err);

        alert(err.error?.message || "Status update failed");

        // ✅ reload to reset dropdown back to original status
        this.loadOrders();
      }
    });
  }
}