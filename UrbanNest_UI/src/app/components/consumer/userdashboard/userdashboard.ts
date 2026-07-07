import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Product } from '../../../interface/product';
import { WishlistItem } from '../../../interface/WishlistItem';
import { Consumer } from '../../../service/consumer';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-userdashboard',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './userdashboard.html',
  styleUrl: './userdashboard.css',
})
export class Userdashboard implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  categories: string[] = [];
  selectedCategory: string | null = null;
  showFilters: boolean = false;

  wishlist: WishlistItem[] = [];
  cart: any[] = [];

  minPrice: number | null = null;
  maxPrice: number | null = null;
  maxPriceAvailable: number = 0;

  loading = true;

  private chng = inject(ChangeDetectorRef);

  constructor(
    private consumerService: Consumer,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] || 'All';
      this.applyFilter();
    });

    this.loadAll();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  trackById(index: number, item: Product) {
    return item.productId;
  }

  loadAll() {
    this.loading = true;

    forkJoin({
      products: this.consumerService.allProducts(),
      wishlist: this.consumerService.getWishlist(),
      cart: this.consumerService.getCartItems(),
    }).subscribe({
      next: (res) => {
        // Normalize casing defensively — backend sends camelCase JSON
        // even though the Product interface types CategoryName as PascalCase
        this.products = res.products.map((p: any) => ({
          ...p,
          categoryName: p.categoryName ?? p.CategoryName ?? '',
          subCategoryName: p.subCategoryName ?? p.SubCategoryName ?? '',
        }));

        this.wishlist = res.wishlist;

        this.cart = res.cart.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        const uniqueCats = new Set(this.products.map((p) => p.categoryName).filter((c) => !!c));
        this.categories = ['All', ...Array.from(uniqueCats)];

        this.maxPriceAvailable =
          this.products.length > 0 ? Math.max(...this.products.map((p) => p.productPrice)) : 0;

        if (this.minPrice === null) this.minPrice = 0;
        if (this.maxPrice === null) this.maxPrice = this.maxPriceAvailable;

        this.applyFilter();
        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  applyFilter() {
    let filtered = this.products;

    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.categoryName === this.selectedCategory);
    }

    let min = this.minPrice ?? 0;
    let max = this.maxPrice ?? this.maxPriceAvailable;

    if (min > max) {
      [min, max] = [max, min];
    }

    filtered = filtered.filter((p) => p.productPrice >= min && p.productPrice <= max);

    this.filteredProducts = filtered;
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilter();
  }

  isInWishlist(productId: number): boolean {
    return this.wishlist.some((w) => w.productId === productId);
  }

  toggleWishlist(productId: number) {
    if (this.isInWishlist(productId)) {
      this.wishlist = this.wishlist.filter((w) => w.productId !== productId);

      this.consumerService.removeFromWishlist(productId).subscribe({
        error: (err) => {
          console.error('Failed to remove from wishlist', err);
          this.wishlist.push({ productId } as WishlistItem);
          this.chng.detectChanges();
        },
      });
    } else {
      this.wishlist.push({ productId } as WishlistItem);

      this.consumerService.addToWishlist(productId).subscribe({
        error: (err) => {
          console.error('Failed to add to wishlist', err);
          this.wishlist = this.wishlist.filter((w) => w.productId !== productId);
          this.chng.detectChanges();
        },
      });
    }
  }

  isInCart(productId: number): boolean {
    return this.cart.some((c) => c.productId === productId);
  }

  addToCart(product: Product) {
    this.consumerService.addToCart(product.productId, 1).subscribe({
      next: () => this.loadAll(),
      error: (err) => console.error('Failed to add to cart', err),
    });
  }

  viewDetails(id: number) {
    this.router.navigate(['/consumerNavbar/product-details', id]);
  }

  applyPriceFilter() {
    this.applyFilter();
  }

  buyNow(event: Event, item: Product): void {
    event.stopPropagation();
    if (item.stock === 0) return;

    this.consumerService.addToCart(item.productId, 1).subscribe({
      next: () => this.router.navigate(['/consumerNavbar/checkout']),
      error: (err) => console.error('Failed to buy now', err),
    });
  }

  resetPrice() {
    this.minPrice = 0;
    this.maxPrice = this.maxPriceAvailable;
    this.applyFilter();
  }
}
