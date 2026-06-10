import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Product } from '../../interface/product';
import { Consumer } from '../../service/consumer';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {

  products: Product[] = [];
  filteredProducts: Product[] = [];

  categories: string[] = [];
  selectedCategory: string | null = 'All';

  minPrice: number | null = null;
  maxPrice: number | null = null;
  maxPriceAvailable: number = 0;

  private chng = inject(ChangeDetectorRef);

  constructor(
    private consumerService: Consumer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();

    // ✅ Read category from URL
    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category']
        ? decodeURIComponent(params['category'])
        : 'All';

      this.applyFilter();
    });
  }

  trackById(index: number, item: Product) {
    return item.productId;
  }

  loadAll() {
    this.consumerService.allProducts().subscribe({
      next: (res) => {
        this.products = res;

        // ✅ Category list
        const uniqueCats = new Set(res.map(p => p.CategoryName));
        this.categories = ['All', ...Array.from(uniqueCats)];

        // ✅ Max price
        this.maxPriceAvailable = Math.max(...res.map(p => p.productPrice));

        // ✅ Apply initial filter
        this.applyFilter();

        this.chng.detectChanges();
      }
    });
  }

  applyFilter() {
    let filtered = this.products;

    // ✅ Category filter
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter(
        p => p.CategoryName === this.selectedCategory
      );
    }

    // ✅ Min price
    if (this.minPrice !== null && this.minPrice > 0) {
      filtered = filtered.filter(
        p => p.productPrice >= this.minPrice!
      );
    }

    // ✅ Max price
    if (this.maxPrice !== null && this.maxPrice > 0) {
      filtered = filtered.filter(
        p => p.productPrice <= this.maxPrice!
      );
    }

    this.filteredProducts = filtered;
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilter();
  }

  resetPriceFilter() {
    this.minPrice = null;
    this.maxPrice = null;
    this.applyFilter();
  }

  /* ✅ LOGIN MESSAGE */
  showAuthMessage() {
    const snackRef = this.snackBar.open(
      '⚠ Please sign in to continue',
      'Login',
      {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['urban-snackbar'],
      }
    );

    snackRef.onAction().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}