import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-shop-by-price',
  imports: [CommonModule],
  templateUrl: './shop-by-price.html',
  styleUrl: './shop-by-price.css',
})
export class ShopByPrice {
  priceRanges = [
  {
    label: 'UNDER ₹999',
    value: 999,
    category: 'Beauty & Personal Care',
    title: 'Beauty Essentials',
    image: 'assets/Category/beauty.jpg',
  },
  {
    label: 'UNDER ₹199',
    value: 199,
    category: 'Home Decor',
    title: 'Home Decor',
    image: 'assets/Category/home-decor.jpg',
  },
  {
    label: 'UNDER ₹299',
    value: 299,
    category: 'Home',
    title: 'Kitchen Items',
    image: 'assets/Category/Home.jpg',
  }
];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  filterByPrice(price: number, category: string) {
  this.router.navigate(['/products'], {
    queryParams: {
      maxPrice: price,
      category: category
    }
  });
}
}
