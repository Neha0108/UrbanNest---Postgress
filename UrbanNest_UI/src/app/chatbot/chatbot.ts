import {
  Component,
  ElementRef,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Chatbotservice } from '../service/chatbotservice';
import {
  ChatMessage,
  ChatProductCard,
  ChatResponse
} from '../interface/chat-message';
import { Consumer } from '../service/consumer';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})
export class Chatbot {

  @ViewChild('messageContainer')
  messageContainer!: ElementRef<HTMLDivElement>;

  isOpen = signal(false);

  messages = signal<ChatMessage[]>([
    {
      from: 'bot',
      text: 'Hi! I am Urban Nest AI. Ask me about products, orders, cart, wishlist, or shopping recommendations.'
    }
  ]);

  quickReplies = signal<string[]>([
    'Track Order',
    'Show my Cart',
    'Show my Wishlist',
    'Beauty Products',
    'Help'
  ]);

  draft = '';

  sending = signal(false);

  addedIds = new Set<number>();

  constructor(
    private chatbotService: Chatbotservice,
    private consumerService: Consumer,
    private router: Router
  ) {}

  toggle(): void {
    this.isOpen.update(value => !value);

    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendQuickReply(text: string): void {
    this.draft = text;
    this.send();
  }

  send(): void {
    const text = this.draft.trim();

    if (!text || this.sending()) {
      return;
    }

    this.messages.update(messages => [
      ...messages,
      {
        from: 'user',
        text
      }
    ]);

    this.draft = '';

    this.sending.set(true);

    this.scrollToBottom();

    this.chatbotService.ask(text).subscribe({
      next: (res: ChatResponse) => {

        this.messages.update(messages => [
          ...messages,
          {
            from: 'bot',
            text: res.reply,
            products: res.products
          }
        ]);

        if (res.quickReplies?.length) {
          this.quickReplies.set(res.quickReplies);
        }

        this.sending.set(false);

        this.scrollToBottom();
      },

      error: (err) => {

        console.error('Chatbot Error:', err);

        this.messages.update(messages => [
          ...messages,
          {
            from: 'bot',
            text: 'Sorry, Urban Nest AI is currently unavailable.'
          }
        ]);

        this.sending.set(false);

        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  imageUrl(card: ChatProductCard): string {
    const image = card.imagePath?.[0];

    return image
      ? `http://localhost:5146${image}`
      : 'assets/no-image.png';
  }

  viewProduct(card: ChatProductCard): void {
    this.router.navigate([
      '/consumerNavbar/product-details',
      card.productId
    ]);
  }

  addToCart(card: ChatProductCard): void {

    if (this.addedIds.has(card.productId)) {
      return;
    }

    this.consumerService
      .addToCart(card.productId, 1)
      .subscribe({
        next: () => {
          this.addedIds.add(card.productId);
        },
        error: (err) => {
          console.error('Add To Cart Failed', err);
        }
      });
  }

  addToWishlist(card: ChatProductCard): void {
    this.consumerService
      .addToWishlist(card.productId)
      .subscribe({
        error: err => {
          console.error('Add To Wishlist Failed', err);
        }
      });
  }
}