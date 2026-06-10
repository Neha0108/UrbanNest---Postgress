export interface CartItem {
  productId: number;
  productName: string;
  productPrice: number;
  imagePath?: string[];
  quantity: number;
}