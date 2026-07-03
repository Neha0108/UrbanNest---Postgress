import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { Product } from '../../../interface/product';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consumerService = inject(Consumer);
  private chng = inject(ChangeDetectorRef);

  product: Product | null = null;
  relatedProducts: Product[] = [];
  loading = true;
  notFound = false;

  activeImageIndex = 0;
  quantity = 1;

  activeTab: 'description' | 'specifications' | 'reviews' = 'description';

  pincode = '';
  deliveryChecked = false;
  deliveryMessage = '';

  addedToCart = false;
  addedToWishlist = false;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      if (id) this.loadProduct(id);
    });
  }

  loadProduct(productId: number): void {
    this.loading = true;
    this.notFound = false;

    this.consumerService.allProducts().subscribe({
      next: (data: Product[]) => {
        const found = data.find((p) => p.productId === productId);

        if (!found) {
          this.notFound = true;
          this.loading = false;
          this.chng.detectChanges();
          return;
        }

        this.product = found;
        this.activeImageIndex = 0;
        this.quantity = 1;
        this.deliveryChecked = false;

        this.relatedProducts = data
          .filter((p) => p.CategoryName === found.CategoryName && p.productId !== found.productId)
          .slice(0, 4);

        this.trackRecentlyViewed(found);

        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load product', err);
        this.notFound = true;
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  private trackRecentlyViewed(product: Product): void {
    const viewed: number[] = JSON.parse(localStorage.getItem('recentProducts') || '[]');
    const filtered = viewed.filter((id) => id !== product.productId);
    filtered.unshift(product.productId);
    localStorage.setItem('recentProducts', JSON.stringify(filtered.slice(0, 10)));
    localStorage.setItem('lastCategory', product.CategoryName);
  }

  setActiveImage(index: number): void {
    this.activeImageIndex = index;
  }

  increaseQty(): void {
    if (!this.product) return;
    if (this.quantity < this.product.stock) this.quantity++;
  }

  decreaseQty(): void {
    if (this.quantity > 1) this.quantity--;
  }

  setTab(tab: 'description' | 'specifications' | 'reviews'): void {
    this.activeTab = tab;
  }

  checkDelivery(): void {
    if (!this.pincode || this.pincode.length !== 6) {
      this.deliveryMessage = 'Please enter a valid 6-digit pincode';
      this.deliveryChecked = true;
      return;
    }
    this.deliveryChecked = true;
    this.deliveryMessage = `Delivery available to ${this.pincode}`;
  }

  addToCart(): void {
    if (!this.product || this.product.stock === 0) return;

    this.consumerService.addToCart(this.product.productId, this.quantity).subscribe({
      next: () => {
        this.addedToCart = true;
        this.chng.detectChanges();
        setTimeout(() => {
          this.addedToCart = false;
          this.chng.detectChanges();
        }, 1800);
      },
      error: (err: any) => console.error('Failed to add to cart', err),
    });
  }

  addToWishlist(): void {
    if (!this.product) return;

    this.consumerService.addToWishlist(this.product.productId).subscribe({
      next: () => {
        this.addedToWishlist = true;
        this.chng.detectChanges();
        setTimeout(() => {
          this.addedToWishlist = false;
          this.chng.detectChanges();
        }, 1800);
      },
      error: (err: any) => console.error('Failed to add to wishlist', err),
    });
  }

  buyNow(): void {
    if (!this.product || this.product.stock === 0) return;

    this.router.navigate(['/consumerNavbar/address'], {
      state: {
        buyNow: true,
        productId: this.product.productId,
        quantity: this.quantity,
      },
    });
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/consumerNavbar/product-details', product.productId]);
  }

  trackById(index: number, item: Product): number {
    return item.productId;
  }
}