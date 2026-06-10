import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Consumer } from '../../../service/consumer';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {

  orders: any[] = [];
  total: number = 0;
  selectedOrder: any = null;

  constructor(private consumerService: Consumer, private router: Router) { }

  public chg = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.consumerService.getUserOrders().subscribe({
      next: (res) => {
        this.orders = res;
        this.chg.detectChanges();
        console.log(this.orders);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  getOrderTotal(items: any[]): number {
    return items.reduce((sum, item) => {
      return sum + (item.Price * item.Quantity);
    }, 0);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Pending': return 'pending';
      case 'Confirmed': return 'confirmed';
      case 'Shipped': return 'shipped';
      case 'Out for Delivery': return 'out';
      case 'Delivered': return 'delivered';
      default: return '';
    }
  }

  cancelOrder(orderId: number) {

    if (!confirm("Are you sure you want to cancel this order?"))
      return;

    this.consumerService.cancelOrder(orderId).subscribe({
      next: () => {

        // ✅ update UI instantly
        const order = this.orders.find(o => o.OrderId === orderId);
        if (order) order.Status = "Cancelled";

        alert("Order cancelled");
      },
      error: err => {
        console.error(err);
        alert("Cancel failed");
      }
    });
  }

  trackOrder(order: any) {
    this.selectedOrder = order;
  }
  closeTrack() {
    this.selectedOrder = null;
  }

  isStepDone(step: string): boolean {

    const steps = [
      'Pending',
      'Confirmed',
      'Shipped',
      'Out for Delivery',
      'Delivered'
    ];

    const currentIndex = steps.indexOf(this.selectedOrder?.Status);
    const stepIndex = steps.indexOf(step);

    return stepIndex <= currentIndex;
  }
}