import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Consumer } from '../../../service/consumer';
import { Product } from '../../../interface/product';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css']
})
export class ProductDetails implements OnInit {

  private route = inject(ActivatedRoute);
  private service = inject(Consumer);
  private chng = inject(ChangeDetectorRef);
  private router = inject(Router);

  product: Product | null = null;
  reviews: any[] = [];
  cartItems: any[] = [];

  //  FIXED: single string (not array)
  selectedImage: string = '';

  quantity: number = 1;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      //  Load product details
      this.service.getProductById(id).subscribe({
        next: (res) => {
          this.product = res;
          console.log('Product details:', res);

          //  Set default image
          this.selectedImage = res.imagepath?.[0] || '';
          this.chng.detectChanges();
        },
        error: (err) => {
          console.error('Error loading product:', err);
        }
      });

      //  Load cart items
      this.service.getCartItems().subscribe({
        next: (res: any[]) => {
          this.cartItems = res.map(item => ({
            productId: item.ProductId,
            quantity: item.Quantity
          }));
          this.chng.detectChanges();
        },
        error: (err) => console.error('Error loading cart:', err)
      });

      //  Dummy reviews (replace later with API)
      this.reviews = [
        { rating: 5, comment: 'Amazing product 🔥' },
        { rating: 4, comment: 'Very good quality 👍' }
      ];
    }
  }

  //  Thumbnail click
  selectImage(img: string): void {
    this.selectedImage = img;
    this.chng.detectChanges(); //  Trigger change detection
  }

  //  Increase quantity (max = stock)
  increaseQty(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
      this.chng.detectChanges(); //  Trigger change detection
    }
  }

  //  Decrease quantity (min = 1)
  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  //  Check if product is in cart
  isInCart(): boolean {
    return this.cartItems.some(c => c.productId === this.product?.productId);
  }

  addToCart(): void {
    if (!this.product) return;
    console.log('Adding to cart:', {
      productId: this.product.productId,
      quantity: this.quantity
    });

    this.service.addToCart(this.product.productId).subscribe({
      next: () => {
        console.log('Product added to cart successfully');
        alert(' Added to cart!');
        //  Reload cart items
        this.service.getCartItems().subscribe({
          next: (res: any[]) => {
            this.cartItems = res.map(item => ({
              productId: item.ProductId,
              quantity: item.Quantity
            }));
            this.chng.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
      }
    });
  }

  //  Buy Now - navigate to order page with this product
  buyNow(): void {
    if (!this.product) return;
    this.service.addToCart(this.product.productId).subscribe({
      next: () => {
        console.log('Product added to cart for purchase');
        alert(' Added to cart! Redirecting to checkout...');
        this.router.navigate(['/consumerNavbar/cart'])
      }
    });
  }
}