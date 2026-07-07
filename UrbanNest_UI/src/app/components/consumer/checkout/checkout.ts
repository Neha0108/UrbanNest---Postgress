import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { Address } from '../../../interface/address';
import { CartItem } from '../../../interface/cart-item';

declare var Razorpay: any;

type CheckoutStep = 'address' | 'payment' | 'review';
type PaymentMethod = 'razorpay' | 'cod';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private consumerService = inject(Consumer);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private chng = inject(ChangeDetectorRef);

  step: CheckoutStep = 'address';

  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  showAddressForm = false;
  loadingAddresses = true;

  cartItems: CartItem[] = [];
  loadingCart = true;
  placingOrder = false;

  paymentMethod: PaymentMethod = 'razorpay';

  addressForm = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    addressLine: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    isDefault: [false],
  });

  readonly steps: { key: CheckoutStep; label: string }[] = [
    { key: 'address', label: 'Address' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
  ];

  ngOnInit(): void {
    this.loadAddresses();
    this.loadCart();
  }

  loadAddresses(): void {
    this.loadingAddresses = true;

    this.consumerService.getAddresses().subscribe({
      next: (data: Address[]) => {
        this.addresses = data;

        const def = data.find((a) => a.isDefault) || data[0];
        if (def) this.selectedAddressId = def.addressId ?? null;

        this.loadingAddresses = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load addresses', err);
        this.loadingAddresses = false;
        this.chng.detectChanges();
      },
    });
  }

  loadCart(): void {
    this.loadingCart = true;

    this.consumerService.getCartItems().subscribe({
      next: (res: any[]) => {
        this.cartItems = res.map((item) => ({
          ProductId: item.productId,
          ProductName: item.productName,
          ProductPrice: item.productPrice,
          ImagePath: item.imagePath,
          Quantity: item.quantity,
        }));

        this.loadingCart = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        this.loadingCart = false;
        this.chng.detectChanges();
      },
    });
  }

  selectAddress(id: number | undefined): void {
    if (id === undefined) return;
    this.selectedAddressId = id;
  }

  saveNewAddress(): void {
    if (this.addressForm.invalid) return;

    const payload: Address = {
      ...(this.addressForm.value as Address),
      isDefault: !!this.addressForm.value.isDefault,
    };

    this.consumerService.addAddress(payload).subscribe({
      next: () => {
        // backend doesn't return the created address object with a typed shape,
        // so reload the full list to stay in sync with the server
        this.showAddressForm = false;
        this.addressForm.reset();
        this.loadAddresses();
      },
      error: (err) => console.error('Failed to save address', err),
    });
  }

  goToStep(target: CheckoutStep): void {
    if (target === 'payment' && !this.selectedAddressId) return;
    if (target === 'review' && !this.selectedAddressId) return;
    this.step = target;
  }

  nextFromAddress(): void {
    if (!this.selectedAddressId) return;
    this.step = 'payment';
  }

  nextFromPayment(): void {
    this.step = 'review';
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.ProductPrice * item.Quantity, 0);
  }

  get shipping(): number {
    return this.subtotal >= 999 || this.cartItems.length === 0 ? 0 : 49;
  }

  get tax(): number {
    return Math.round(this.subtotal * 0.05);
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax;
  }

  get selectedAddress(): Address | undefined {
    return this.addresses.find((a) => a.addressId === this.selectedAddressId);
  }

  placeOrder(): void {

  if (!this.selectedAddressId) {
    alert('Please select an address');
    return;
  }

  if (this.cartItems.length === 0) {
    alert('Your cart is empty');
    return;
  }

  if (this.placingOrder) return;

  this.placingOrder = true;

  const productIds = this.cartItems.map(item => item.ProductId);

  console.log("========== PLACE ORDER ==========");
  console.log("ProductIds:", productIds);
  console.log("Address:", this.selectedAddressId);
  console.log("Total:", this.total);

  // COD
  if (this.paymentMethod === 'cod') {
    this.submitOrder(productIds);
    return;
  }

  // Razorpay
  this.consumerService.payment(this.total).subscribe({

    next: (order: any) => {

      console.log("========== RAZORPAY ORDER ==========");
      console.log(order);

      const options: any = {

        key: order.key,
        amount: order.amount,
        currency: order.currency,

        // IMPORTANT
        order_id: order.orderId,

        name: 'Urban Nest',
        description: 'Order Payment',

        handler: (response: any) => {

          console.log("========== PAYMENT SUCCESS ==========");
          console.log(response);

          const verifyBody = {
            RazorpayOrderId: response.razorpay_order_id,
            RazorpayPaymentId: response.razorpay_payment_id,
            RazorpaySignature: response.razorpay_signature
          };

          console.log("Verify Payload");
          console.log(verifyBody);

          this.consumerService.verifyPayment(verifyBody).subscribe({

            next: (verifyRes: any) => {

              console.log("Payment Verified");
              console.log(verifyRes);

              this.submitOrder(productIds);
            },

            error: (err: any) => {

              console.error("Verification Failed");
              console.log(err);
              console.log(err.error);

              this.placingOrder = false;
              this.chng.detectChanges();

              alert("Payment verification failed.");
            }

          });

        },

        modal: {

          ondismiss: () => {

            console.log("Payment cancelled");

            this.placingOrder = false;
            this.chng.detectChanges();
          }

        },

        theme: {
          color: '#C9A55C'
        }

      };

      const rzp = new Razorpay(options);

      rzp.on('payment.failed', (response: any) => {

        console.log("========== PAYMENT FAILED ==========");
        console.log(response);

        this.placingOrder = false;
        this.chng.detectChanges();
      });

      rzp.open();

    },

    error: (err: any) => {

      console.error("Create Razorpay Order Failed");
      console.log(err);
      console.log(err.error);

      this.placingOrder = false;
      this.chng.detectChanges();
    }

  });

}

private submitOrder(productIds: number[]): void {
  const body = {
    SelectedProductIds: productIds,
    AddressId: this.selectedAddressId!,
  };

  this.consumerService.placeOrder(body).subscribe({
    next: (res: any) => {
      this.placingOrder = false;
      this.router.navigate(['/consumerNavbar/order'], {
        state: { orderId: res.orderId },
      });
    },
    error: (err) => {
      console.error('Failed to place order', err.error);
      this.placingOrder = false;
      this.chng.detectChanges();
      alert('Failed to place your order. Please try again.');
    },
  });
}


  trackByProductId(index: number, item: CartItem): number {
    return item.ProductId;
  }
}
