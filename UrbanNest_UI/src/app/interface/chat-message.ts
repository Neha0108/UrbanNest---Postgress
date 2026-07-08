export interface ChatMessage {
    from: 'user' | 'bot';
    text: string;
    products?: ChatProductCard[];
}
export interface ChatProductCard {
  productId: number;
  productName: string;
  productPrice: number;
  imagePath: string[];
  stock: number;
  categoryName: string;
}

export interface ChatResponse {
  reply: string;
  products?: ChatProductCard[];
  quickReplies: string[];
}