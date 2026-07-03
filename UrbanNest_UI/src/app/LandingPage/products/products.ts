import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Consumer } from '../../service/consumer';
import { Product } from '../../interface/product';
import { Category } from '../../interface/category';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {

  private consumerService = inject(Consumer);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chng = inject(ChangeDetectorRef);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  selectedCategory: string | null = null;
  selectedMaxPrice: number | null = null;
  sortBy: SortOption = 'newest';

  loading = true;
  filtersOpen = false;
  recentlyAddedId: number | null = null;
  recentlyWishlistedId: number | null = null;

  priceRanges = [
    { label: 'Under ₹99', value: 99 },
    { label: 'Under ₹199', value: 199 },
    { label: 'Under ₹299', value: 299 },
    { label: 'Under ₹499', value: 499 },
    { label: 'Under ₹999', value: 999 },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] ? decodeURIComponent(params['category']) : null;
      this.selectedMaxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;
      this.applyFilters();
    });

    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.consumerService.getCategories().subscribe({
      next: (cats: Category[]) => {
        this.categories = cats;
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load categories', err),
    });

    this.consumerService.allProducts().subscribe({
      next: (data: Product[]) => {
        this.allProducts = data;
        this.applyFilters();
        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  applyFilters(): void {
    let result = [...this.allProducts];

    if (this.selectedCategory) {
      result = result.filter(
        (p) => p.CategoryName?.toLowerCase() === this.selectedCategory?.toLowerCase()
      );
    }

    if (this.selectedMaxPrice) {
      result = result.filter((p) => p.productPrice <= this.selectedMaxPrice!);
    }

    result = this.sortProducts(result, this.sortBy);

    this.filteredProducts = result;
    this.chng.detectChanges();
  }

  sortProducts(list: Product[], sort: SortOption): Product[] {
    const sorted = [...list];
    switch (sort) {
      case 'price-low':
        return sorted.sort((a, b) => a.productPrice - b.productPrice);
      case 'price-high':
        return sorted.sort((a, b) => b.productPrice - a.productPrice);
      case 'name':
        return sorted.sort((a, b) => a.productName.localeCompare(b.productName));
      default:
        return sorted;
    }
  }

  onSortChange(value: string): void {
    this.sortBy = value as SortOption;
    this.applyFilters();
  }

  selectCategory(name: string | null): void {
    this.router.navigate(['/products'], {
      queryParams: {
        category: name ? encodeURIComponent(name) : null,
        maxPrice: this.selectedMaxPrice ?? null,
      },
      queryParamsHandling: 'merge',
    });
  }

  selectPrice(value: number | null): void {
    this.router.navigate(['/products'], {
      queryParams: {
        category: this.selectedCategory ? encodeURIComponent(this.selectedCategory) : null,
        maxPrice: value,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearFilters(): void {
    this.router.navigate(['/products']);
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  goToProduct(product: Product): void {
    localStorage.setItem('lastCategory', product.CategoryName);
    this.router.navigate(['/consumerNavbar/product-details', product.productId]);
  }

  addToWishlist(event: Event, product: Product): void {
    event.stopPropagation();
    this.consumerService.addToWishlist(product.productId).subscribe({
      next: () => {
        this.recentlyWishlistedId = product.productId;
        this.chng.detectChanges();
        setTimeout(() => {
          this.recentlyWishlistedId = null;
          this.chng.detectChanges();
        }, 1500);
      },
      error: (err) => console.error('Failed to add to wishlist', err),
    });
  }

  addToCart(event: Event, product: Product): void {
    event.stopPropagation();
    if (product.stock === 0) return;

    this.consumerService.addToCart(product.productId,1).subscribe({
      next: () => {
        this.recentlyAddedId = product.productId;
        this.chng.detectChanges();
        setTimeout(() => {
          this.recentlyAddedId = null;
          this.chng.detectChanges();
        }, 1500);
      },
      error: (err) => console.error('Failed to add to cart', err),
    });
  }

  trackById(index: number, item: Product): number {
    return item.productId;
  }
}