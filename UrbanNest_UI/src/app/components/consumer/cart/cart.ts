import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CartItem } from '../../../interface/cart-item';
import { Consumer } from '../../../service/consumer';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {

  cartItems: CartItem[] = [];
  total = 0;
  selectedItems: Set<number> = new Set(); //  Track selected product IDs

  constructor(private consumerService: Consumer, private router: Router) { }

  public chg = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.consumerService.getCartItems().subscribe({
      next: (res: any[]) => {
        this.cartItems = res.map(item => ({
          productId: item.ProductId,
          productName: item.ProductName,
          productPrice: item.ProductPrice,
          imagePath: item.ImagePath,
          quantity: item.Quantity
        }));
        console.log(this.cartItems);
        this.calculateTotal();
        this.chg.detectChanges();
      },
      error: err => console.error(err)
    });
  }

  calculateTotal(): void {
    this.total = this.cartItems.reduce(
      (sum, item) => sum + (item.productPrice ?? 0) * (item.quantity ?? 0),
      0
    );
    this.chg.detectChanges();
  }

  increaseQty(item: CartItem) {
    item.quantity++;

    this.consumerService
      .updateQuantity(item.productId, item.quantity)
      .subscribe(() => this.calculateTotal());
  }

  decreaseQty(item: CartItem) {
    if (item.quantity === 1) return;

    item.quantity--;

    this.consumerService
      .updateQuantity(item.productId, item.quantity)
      .subscribe(() => this.calculateTotal());
  }


  removeItem(productId: number) {
    this.consumerService.removeFromCart(productId).subscribe(() => {
      this.cartItems = this.cartItems.filter(
        i => i.productId !== productId
      );
      this.selectedItems.delete(productId); //  Remove from selection
      this.calculateTotal();
    });
  }

  //  Toggle item selection
  toggleItemSelection(productId: number): void {
    if (this.selectedItems.has(productId)) {
      this.selectedItems.delete(productId);
    } else {
      this.selectedItems.add(productId);
    }
  }

  //  Check if item is selected
  isItemSelected(productId: number): boolean {
    return this.selectedItems.has(productId);
  }

  //  Calculate total for selected items
  getSelectedTotal(): number {
    return this.cartItems
      .filter(item => this.selectedItems.has(item.productId))
      .reduce((sum, item) => sum + (item.productPrice ?? 0) * (item.quantity ?? 0), 0);
  }

  //  Select all items
  selectAll(): void {
    this.cartItems.forEach(item => this.selectedItems.add(item.productId));
  }

  //  Deselect all items
  deselectAll(): void {
    this.selectedItems.clear();
  }

  placeOrder() {
    if (this.selectedItems.size === 0) {
      alert('❌ Please select at least one item to place order');
      return;
    }

    const selectedProductIds = Array.from(this.selectedItems);
    const selectedTotal = this.getSelectedTotal();

    this.router.navigate(['consumerNavbar/address'], {
      state: {
        selectedProductIds: selectedProductIds,
        selectedTotal: selectedTotal
      }
    });
  }
}