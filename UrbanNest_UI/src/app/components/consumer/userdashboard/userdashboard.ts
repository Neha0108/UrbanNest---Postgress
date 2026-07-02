import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Product } from '../../../interface/product';
import { WishlistItem } from '../../../interface/WishlistItem';
import { Consumer } from '../../../service/consumer';
import { FormsModule } from '@angular/forms';

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

  private chng = inject(ChangeDetectorRef);

  constructor(
    private consumerService: Consumer,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    //  listen for category from URL
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || 'All';
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
    forkJoin({
      products: this.consumerService.allProducts(),
      wishlist: this.consumerService.getWishlist(),
      cart: this.consumerService.getCartItems()
    }).subscribe({
      next: (res) => {
        this.products = res.products;
        console.log(this.products);
        this.wishlist = res.wishlist;

        this.cart = res.cart.map((item: any) => ({
          productId: item.ProductId,
          quantity: item.Quantity
        }));

        // ✅ category list
        const uniqueCats = new Set(res.products.map(p => p.CategoryName));
        this.categories = ['All', ...Array.from(uniqueCats)];

        // ✅ max price
        this.maxPriceAvailable = Math.max(...res.products.map(p => p.productPrice));

        // ✅ IMPORTANT: default values for price
        if (this.minPrice === null) this.minPrice = 0;
        if (this.maxPrice === null) this.maxPrice = this.maxPriceAvailable;

        // ✅ FINAL FILTER
        this.applyFilter();

        this.chng.detectChanges();
      }
    });
  }

  /*  CORE FILTER LOGIC */
  applyFilter() {

    let filtered = this.products;

    // ✅ Category filter
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter(
        p => p.CategoryName === this.selectedCategory
      );
    }

    // ✅ Fix invalid range (IMPORTANT)
    let min = this.minPrice ?? 0;
    let max = this.maxPrice ?? this.maxPriceAvailable;

    if (min > max) {
      [min, max] = [max, min]; // swap values
    }

    // ✅ Apply price filter
    filtered = filtered.filter(
      p => p.productPrice >= min && p.productPrice <= max
    );

    this.filteredProducts = filtered;
  }

  /*  Category navbar click */
  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilter();
  }

  /*  Wishlist */
  isInWishlist(productId: number): boolean {
    return this.wishlist.some(w => w.productId === productId);
  }

  toggleWishlist(productId: number) {
    if (this.isInWishlist(productId)) {
      this.wishlist = this.wishlist.filter(w => w.productId !== productId);
      this.consumerService.removeFromWishlist(productId).subscribe();
    } else {
      this.wishlist.push({ productId: productId } as WishlistItem);
      this.consumerService.addToWishlist(productId).subscribe();
    }
  }

  /*  Cart */
  isInCart(productId: number): boolean {
    return this.cart.some(c => c.productId === productId);
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
}