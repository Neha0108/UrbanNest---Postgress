import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Category } from '../../LandingPage/category/category';
import { ShopByPrice } from "../../LandingPage/shop-by-price/shop-by-price";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, Category, ShopByPrice],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private router = inject(Router);
  private chng = inject(ChangeDetectorRef);

  goToRetailer() {
    this.router.navigate(['/register']); // change route if needed
  }

 goToProducts(category?: string) {
  if (category) {
    this.router.navigate(['/products'], {
      queryParams: {
        category: encodeURIComponent(category)
      }
    });
  } else {
    this.router.navigate(['/products']);
  }
}

currentSlide = 0;

slides = [
  {
    title: 'MEGA FASHION DAYS',
    subtitle: 'Up to 60% OFF on premium fashion, footwear and accessories.',
    buttonText: 'Shop Fashion',
    image: 'assets/addvertisement/fashion-banner.png',
    category: 'Fashion'   // ✅ match CategoryName
  },
  {
    title: 'HOME MAKEOVER FESTIVAL',
    subtitle: 'Up to 40% OFF on furniture, décor and lifestyle essentials.',
    buttonText: 'Explore Home',
    image: 'assets/addvertisement/home-banner.png',
    category: 'Home'
  },
  {
    title: 'BEAUTY ESSENTIALS WEEK',
    subtitle: 'Skincare, wellness and beauty products starting at ₹99.',
    buttonText: 'Shop Beauty',
    image: 'assets/addvertisement/beauty-banner.png',
    category: 'Beauty'
  }
];

private sliderInterval: any;

ngOnInit() {

  this.sliderInterval = setInterval(() => {

    this.currentSlide =
      (this.currentSlide + 1) % this.slides.length;
      this.chng.detectChanges(); // Trigger change detection to update the view
      console.log('Current Slide:', this.currentSlide); // Debug log to check slide index

  }, 4000);

}

ngOnDestroy() {

  clearInterval(this.sliderInterval);

}
}
