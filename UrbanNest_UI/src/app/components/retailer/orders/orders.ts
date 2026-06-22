import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Retailer } from '../../../service/retailer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {

  orders: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private retailerService: Retailer,
    private chng: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.errorMessage = '';

    this.retailerService.getRetailerOrders().subscribe({
      next: (res: any[]) => {

        this.orders = res.map(order => {
          const items = order.items || order.Items || [];

          const uniqueCategories = [
            ...new Set(
              items
                .map((item: any) => item.categoryName || item.CategoryName)
                .filter((category: string) => !!category)
            )
          ];

          console.log('Processed Order:', res);

          return {
            ...order,
            orderId: order.orderId || order.OrderId,
            orderDate: order.orderDate || order.OrderDate,
            status: order.status || order.Status,
            items: items.map((item: any) => ({
              productId: item.productId || item.ProductId,
              productName: item.productName || item.ProductName,
              quantity: item.quantity || item.Quantity,
              price: item.price || item.Price,
              stock: item.stock || item.Stock,
              categoryName: item.categoryName || item.CategoryName
            })),
            uniqueCategories
          };
        });

        this.loading = false;
        this.chng.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load orders.';
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  updateStatus(orderId: number, event: any) {
    const status = event.target.value;

    this.retailerService.updateOrderStatus(orderId, status).subscribe({
      next: (res: any) => {
        const order = this.orders.find((o) => o.orderId === orderId);
        if (order) order.status = status;

        console.log(res.message);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Status update failed');
        this.loadOrders();
      },
    });
  }

  getStatusClass(status: string): string {
    return 'status-' + status?.toLowerCase().replaceAll(' ', '-');
  }
}