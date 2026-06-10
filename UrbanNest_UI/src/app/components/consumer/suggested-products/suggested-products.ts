import { ChangeDetectorRef, Component } from '@angular/core';
import { Product } from '../../../interface/product';
import { Consumer } from '../../../service/consumer';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suggested-products',
  imports: [CommonModule],
  templateUrl: './suggested-products.html',
  styleUrl: './suggested-products.css',
})
export class SuggestedProducts {

  products: Product[] = [];
  recommended: Product[] = [];
  trending: Product[] = [];
  recentlyViewed: Product[] = [];

  lastCategory: string | null = null;

  constructor(
    private consumerService: Consumer,
    private router: Router,
    private chng: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.lastCategory = localStorage.getItem('lastCategory');

    // ✅ Recently viewed (IDs stored)
    const viewedIds = JSON.parse(localStorage.getItem('recentProducts') || '[]');

    this.consumerService.allProducts().subscribe(res => {

      this.products = res;

      // ✅ Recommended
      if (this.lastCategory) {
        this.recommended = this.products.filter(
          p => p.CategoryName === this.lastCategory
        );
        this.chng.detectChanges();
      }

      // ✅ Recently viewed products
      this.recentlyViewed = this.products.filter(
        p => viewedIds.includes(p.productId)
      );

      this.chng.detectChanges();

      // ✅ Trending
      this.trending = this.products.slice(0, 10);
      this.chng.detectChanges();
    });
  }

  // ✅ Navigate to product detail
  goToProduct(product: Product) {

    // ✅ Store recently viewed
    let viewed = JSON.parse(localStorage.getItem('recentProducts') || '[]');

    if (!viewed.includes(product.productId)) {
      viewed.unshift(product.productId);
    }

    localStorage.setItem('recentProducts', JSON.stringify(viewed.slice(0, 10)));
    this.chng.detectChanges();

    // ✅ Store last category
    localStorage.setItem('lastCategory', product.CategoryName);
    this.chng.detectChanges();

    // ✅ Redirect to product details page
    this.router.navigate(['/consumerNavbar/product-details', product.productId]);
    this.chng.detectChanges();
  }

}