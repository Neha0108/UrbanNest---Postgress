import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { CartItem } from '../../../interface/cart-item';
import { Product } from '../../../interface/product';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private consumerService = inject(Consumer);
  private router = inject(Router);
  private chng = inject(ChangeDetectorRef);

  cartItems: CartItem[] = [];
  recommendedProducts: Product[] = [];
  loading = true;
  updatingId: number | null = null;
  removingId: number | null = null;

  readonly shippingThreshold = 999;
  readonly shippingFee = 49;
  readonly taxRate = 0.05; // 5% — adjust to match your actual tax logic if different

  ngOnInit(): void {
    this.loadCart();
    this.loadRecommendations();
  }

  loadCart(): void {
    this.loading = true;

    // ⚠️ Assumed method name — confirm against consumer.ts (backend: ICart.get(userId))
    this.consumerService.getCartItems().subscribe({
      next: (res: any[]) => {
        this.cartItems = res.map((item) => ({
          ProductId: item.productId,
          ProductName: item.productName,
          ProductPrice: item.productPrice,
          ImagePath: item.imagePath,
          Quantity: item.quantity,
        }));

        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  loadRecommendations(): void {
    this.consumerService.allProducts().subscribe({
      next: (data: Product[]) => {
        this.recommendedProducts = data.slice(0, 6);
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load recommendations', err),
    });
  }

  increaseQty(item: CartItem): void {
    this.updateQty(item, item.Quantity + 1);
  }

  decreaseQty(item: CartItem): void {
    if (item.Quantity <= 1) return;
    this.updateQty(item, item.Quantity - 1);
  }

  private updateQty(item: CartItem, newQty: number): void {
    this.updatingId = item.ProductId;

    // ⚠️ Assumed method name — confirm against consumer.ts (backend: ICart.updateQuantity)
    this.consumerService.updateQuantity(item.ProductId, newQty).subscribe({
      next: () => {
        item.Quantity = newQty;
        this.updatingId = null;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update quantity', err);
        this.updatingId = null;
        this.chng.detectChanges();
      },
    });
  }

  removeItem(item: CartItem): void {
    this.removingId = item.ProductId;

    // ⚠️ Assumed method name — confirm against consumer.ts (backend: ICart.RemoveFromCart)
    this.consumerService.removeFromCart(item.ProductId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter((i) => i.ProductId !== item.ProductId);
        this.removingId = null;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to remove item', err);
        this.removingId = null;
        this.chng.detectChanges();
      },
    });
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.ProductPrice * item.Quantity, 0);
  }

  get shipping(): number {
    if (this.cartItems.length === 0) return 0;
    return this.subtotal >= this.shippingThreshold ? 0 : this.shippingFee;
  }

  get tax(): number {
    return Math.round(this.subtotal * this.taxRate);
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax;
  }

  get amountToFreeShipping(): number {
    return Math.max(0, this.shippingThreshold - this.subtotal);
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/consumerNavbar/product-details', product.productId]);
  }

  proceedToCheckout(): void {
    this.router.navigate(['/consumerNavbar/checkout']);
  }

  trackByProductId(index: number, item: CartItem): number {
    return item.ProductId;
  }
}
