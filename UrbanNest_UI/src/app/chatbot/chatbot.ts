import { Component, signal } from '@angular/core';
import { Chatbotservice } from '../service/chatbotservice';
import { ChatMessage, ChatProductCard } from '../interface/chat-message';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Consumer } from '../service/consumer';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chatbot',
  imports: [FormsModule,CommonModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot {

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([
    { from: 'bot', text: "Hi! I can help you find products, check your cart/wishlist, or track an order." },
  ]);
  quickReplies = signal<string[]>(['Track Order', 'Categories', 'Show my Cart', 'Show my Wishlist', 'Help']);
  draft = '';
  sending = signal(false);
  addedIds = new Set<number>();

  constructor(
    private chatbotService: Chatbotservice,
    private consumerService: Consumer,
    private router: Router,
  ) {}

  toggle() {
    this.isOpen.update((v) => !v);
  }

  sendQuickReply(text: string) {
    this.draft = text;
    this.send();
  }

  send() {
    const text = this.draft.trim();
    if (!text || this.sending()) return;

    this.messages.update((list) => [...list, { from: 'user', text }]);
    this.draft = '';
    this.sending.set(true);

    this.chatbotService.ask(text).subscribe({
      next: (res) => {
        this.messages.update((list) => [
          ...list,
          { from: 'bot', text: res.reply, products: res.products },
        ]);
        this.quickReplies.set(res.quickReplies ?? []);
        this.sending.set(false);
      },
      error: () => {
        this.messages.update((list) => [
          ...list,
          { from: 'bot', text: 'Sorry, something went wrong. Please try again.' },
        ]);
        this.sending.set(false);
      },
    });
  }

  imageUrl(card: ChatProductCard): string {
    const path = card.imagePath?.[0];
    return path ? 'http://localhost:5146' + path : '';
  }

  viewProduct(card: ChatProductCard) {
    this.router.navigate(['/consumerNavbar/product-details', card.productId]);
  }

  addToCart(card: ChatProductCard) {
    this.consumerService.addToCart(card.productId, 1).subscribe({
      next: () => this.addedIds.add(card.productId),
      error: (err) => console.error('Add to cart failed', err),
    });
  }

  addToWishlist(card: ChatProductCard) {
    this.consumerService.addToWishlist(card.productId).subscribe({
      error: (err) => console.error('Add to wishlist failed', err),
    });
  }
}