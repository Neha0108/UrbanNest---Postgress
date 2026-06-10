import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Consumer } from '../../../service/consumer';
import { CommonModule } from '@angular/common';
import { WishlistItem } from '../../../interface/WishlistItem';

@Component({
  selector: 'app-wishlist',
  imports: [CommonModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class Wishlist implements OnInit {

  wishlist: WishlistItem[] = [];

  private chg = inject(ChangeDetectorRef);

  constructor(private consumerService: Consumer) { }

  ngOnInit(): void {
    this.consumerService.getWishlist().subscribe({
      next: data => {
        this.wishlist = data;
        this.chg.detectChanges();
        console.log('Wishlist data:', this.wishlist);
      },
      error: (error) => {
        console.error('Error fetching wishlist:', error);
      }
    })
  }

  removeFromWishlist(productId: number) {
    this.consumerService.removeFromWishlist(productId).subscribe({
      next: () => {
        this.wishlist = this.wishlist.filter(item => item.ProductId !== productId);
        this.chg.detectChanges();
      },
      error: (error) => {
        console.error('Error removing from wishlist:', error)
      }
    });
  }
}