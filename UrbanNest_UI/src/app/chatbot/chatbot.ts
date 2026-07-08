import { Component, ElementRef, EventEmitter, Output, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chatbotservice} from '../service/chatbotservice';
import { ChatMessage, ChatProductCard } from '../interface/chat-message';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot implements AfterViewChecked {
  @Output() close = new EventEmitter<void>();
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [
    {
      sender: 'bot',
      text: "Hi! I'm your Urban Nest assistant. Ask me about products, your cart, wishlist, or recent orders.",
      quickReplies: ['Track Order', 'Categories', 'Show my Cart', 'Show my Wishlist', 'Help'],
      timestamp: new Date()
    }
  ];

  draft = '';
  loading = false;
  private shouldScroll = false;

  constructor(
    private chatbotService: Chatbotservice,
    private router: Router
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  send(text?: string): void {
    const message = (text ?? this.draft).trim();
    if (!message || this.loading) {
      return;
    }

    this.messages.push({
      sender: 'user',
      text: message,
      timestamp: new Date()
    });

    this.draft = '';
    this.loading = true;
    this.shouldScroll = true;

    this.chatbotService.ask(message).subscribe({
      next: (res) => {
        this.messages.push({
          sender: 'bot',
          text: res.reply,
          products: res.products,
          quickReplies: res.quickReplies,
          timestamp: new Date()
        });
        this.loading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.push({
          sender: 'bot',
          text: "Sorry, I couldn't reach the assistant right now. Please try again in a moment.",
          quickReplies: ['Track Order', 'Categories', 'Help'],
          timestamp: new Date()
        });
        this.loading = false;
        this.shouldScroll = true;
      }
    });
  }

  onQuickReply(reply: string): void {
    this.send(reply);
  }

  goToProduct(product: ChatProductCard): void {
    this.router.navigate(['/product', product.productId]);
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch {
      // ignore if not yet rendered
    }
  }
}