import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Product } from '../../../interface/product';
import { WishlistItem } from '../../../interface/WishlistItem';
import { Consumer } from '../../../service/consumer';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../service/user-service';

@Component({
  selector: 'app-userdashboard',
  imports: [CommonModule, FormsModule],
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
  isUserLoggedIn = false;

  private chng = inject(ChangeDetectorRef);

  constructor(
    private consumerService: Consumer,
    private route: ActivatedRoute,
    private router: Router,
    private user: UserService,
  ) {}

  ngOnInit(): void {
    this.isUserLoggedIn = this.user.isLoggedIn();

    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] ? decodeURIComponent(params['category']) : 'All';

      this.chng.detectChanges();

      if (params['maxPrice']) {
        this.maxPrice = +params['maxPrice'];
      }

      this.loadAll();
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  trackById(index: number, item: Product) {
    return item.productId;
  }

  loadAll() {
    // Guest User
    if (!this.isUserLoggedIn) {
      this.consumerService.allProducts().subscribe({
        next: (res) => {
          this.products = res;
          this.chng.detectChanges();

          // Categories
          const uniqueCats = new Set(res.map((p) => p.CategoryName));

          this.categories = ['All', ...Array.from(uniqueCats)];

          // Max Price
          this.maxPriceAvailable = Math.max(...res.map((p) => p.productPrice));

          // Default Price Values
          if (this.minPrice === null) {
            this.minPrice = 0;
          }

          if (this.maxPrice === null) {
            this.maxPrice = this.maxPriceAvailable;
          }

          this.applyFilter();

          this.chng.detectChanges();
        },
        error: (err) => {
          console.error('Products Load Error:', err);
        },
      });

      return;
    }

    // Logged In User
    forkJoin({
      products: this.consumerService.allProducts(),
      wishlist: this.consumerService.getWishlist(),
      cart: this.consumerService.getCartItems(),
    }).subscribe({
      next: (res) => {
        this.products = res.products;
        this.wishlist = res.wishlist;
        this.chng.detectChanges();

        this.cart = res.cart.map((item: any) => ({
          productId: item.ProductId,
          quantity: item.Quantity,
        }));

        // Categories
        const uniqueCats = new Set(res.products.map((p) => p.CategoryName));

        this.categories = ['All', ...Array.from(uniqueCats)];

        // Max Price
        this.maxPriceAvailable = Math.max(...res.products.map((p) => p.productPrice));

        // Default Price Values
        if (this.minPrice === null) {
          this.minPrice = 0;
        }

        if (this.maxPrice === null) {
          this.maxPrice = this.maxPriceAvailable;
        }

        this.applyFilter();

        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard Load Error:', err);
      },
    });
  }

  /*  CORE FILTER LOGIC */
  applyFilter() {
    let filtered = this.products;

    // ✅ Category filter
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.CategoryName === this.selectedCategory);
    }

    // ✅ Fix invalid range (IMPORTANT)
    let min = this.minPrice ?? 0;
    let max = this.maxPrice ?? this.maxPriceAvailable;

    if (min > max) {
      [min, max] = [max, min]; // swap values
    }

    // ✅ Apply price filter
    filtered = filtered.filter((p) => p.productPrice >= min && p.productPrice <= max);

    this.filteredProducts = filtered;
  }

  /*  Category navbar click */
  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilter();
  }

  /*  Wishlist */
  isInWishlist(productId: number): boolean {
    return this.wishlist.some((w) => w.ProductId === productId);
  }

  toggleWishlist(productId: number) {
    if (this.isInWishlist(productId)) {
      this.wishlist = this.wishlist.filter((w) => w.ProductId !== productId);
      this.consumerService.removeFromWishlist(productId).subscribe();
    } else {
      this.wishlist.push({ ProductId: productId } as WishlistItem);
      this.consumerService.addToWishlist(productId).subscribe();
    }
  }

  /*  Cart */
  isInCart(productId: number): boolean {
    return this.cart.some((c) => c.productId === productId);
  }

  addToCart(product: Product) {
    this.consumerService.addToCart(product.productId).subscribe(() => {
      this.loadAll();
    });
  }

  viewDetails(id: number) {
    this.router.navigate(['/consumerNavbar/product-details', id]);
  }

  applyPriceFilter() {
    this.applyFilter();
  }

  resetPrice() {
    this.minPrice = null;
    this.maxPrice = null;
    this.applyFilter();
  }

  showAuthMessage() {
    alert('Please login first');
    this.router.navigate(['/login']);
  }
}