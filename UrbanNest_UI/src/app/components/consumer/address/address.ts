import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Consumer } from '../../../service/consumer';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-address',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address.html',
  styleUrl: './address.css',
})
export class Address {

  addresses: any[] = [];
  selectedAddressId: number = 0;
  selectedProductIds: number[] = [];
  selectedTotal: number = 0;
  noAddress = false;
  addressForm!: FormGroup;
  showForm = false;

  constructor(
    private addressService: Consumer,
    private fb: FormBuilder,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();
    this.selectedProductIds = nav?.extras?.state?.['selectedProductIds'] || [];
    this.selectedTotal = nav?.extras?.state?.['selectedTotal'] || 0;
  }

  ngOnInit() {
    this.initForm();
    this.loadAddresses();

    if (this.selectedProductIds.length === 0) {
      console.warn('No selected products received');
    }
  }

  initForm() {
    this.addressForm = this.fb.group({
      fullName: [''],
      phone: [''],
      addressLine: [''],
      city: [''],
      state: [''],
      pincode: [''],
      latitude: [''],
      longitude: [''],
      isDefault: [false]
    });
  }

  loadAddresses() {
    this.addressService.getAddresses().subscribe({
      next: (res: any[]) => {
        console.log('Saved addresses from API:', res);

        this.addresses = (res || []).map(a => ({
          addressId: a.addressId ?? a.AddressId,
          fullName: a.fullName ?? a.FullName,
          phone: a.phone ?? a.Phone,
          addressLine: a.addressLine ?? a.AddressLine,
          city: a.city ?? a.City,
          state: a.state ?? a.State,
          pincode: a.pincode ?? a.Pincode,
          latitude: a.latitude ?? a.Latitude,
          longitude: a.longitude ?? a.Longitude,
          isDefault: a.isDefault ?? a.IsDefault
        }));

        if (this.addresses.length === 0) {
          this.noAddress = true;
          this.showForm = true;
          this.selectedAddressId = 0;
        } else {
          this.noAddress = false;
          this.showForm = false;

          const defaultAddr = this.addresses.find((x: any) => x.isDefault);

          if (defaultAddr) {
            this.selectedAddressId = defaultAddr.addressId;
          } else {
            this.selectedAddressId = this.addresses[0]?.addressId;
          }

          console.log('Mapped addresses:', this.addresses);
          console.log('Selected address id:', this.selectedAddressId);
        }
      },
      error: (err) => {
        console.error('Address load failed:', err);
        alert(err.error?.message || 'Failed to load addresses');
      }
    });
  }

  saveAddress() {
    this.addressService.addAddress(this.addressForm.value)
      .subscribe(() => {
        this.showForm = false;
        this.addressForm.reset({
          fullName: '',
          phone: '',
          addressLine: '',
          city: '',
          state: '',
          pincode: '',
          latitude: '',
          longitude: '',
          isDefault: false
        });
        this.loadAddresses();
      });
  }

  selectAddress(id: number) {
    this.selectedAddressId = id;
  }

  deleteAddress(id: number) {
    this.addressService.deleteAddress(id)
      .subscribe(() => this.loadAddresses());
  }

  getCurrentLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          const a = data.address;

          this.addressForm.patchValue({
            addressLine: data.display_name,
            city: a.city || a.town || a.village || '',
            state: a.state || '',
            pincode: a.postcode || '',
            latitude: lat,
            longitude: lng
          });
        })
        .catch(err => {
          console.error('Location address fetch failed:', err);
          alert('Unable to fetch address from current location');
        });
    }, err => {
      console.error('Location permission denied:', err);
      alert('Please allow location access');
    });
  }

 placeOrder() {

  console.log('===== PLACE ORDER STARTED =====');

  console.log('Selected Products:', this.selectedProductIds);
  console.log('Selected Address:', this.selectedAddressId);
  console.log('Selected Total:', this.selectedTotal);

  if (this.selectedProductIds.length === 0) {
    console.error('No products selected');
    alert('❌ No products selected');
    return;
  }

  if (!this.selectedAddressId) {
    console.error('No address selected');
    alert('❌ Please select or add an address');
    return;
  }

  if (!this.selectedTotal || this.selectedTotal <= 0) {
    console.error('Invalid amount:', this.selectedTotal);
    alert('❌ Invalid order amount');
    return;
  }

  const amount = this.selectedTotal;

  console.log('Creating Razorpay Order...');
  console.log('Amount Sent To Backend:', amount);

  this.addressService.payment(amount).subscribe({

    next: (orderRes: any) => {

      console.log('==============================');
      console.log('ORDER CREATED SUCCESSFULLY');
      console.log('Full Response:', orderRes);
      console.log('Order Id:', orderRes.orderId);
      console.log('Amount:', orderRes.amount);
      console.log('Currency:', orderRes.currency);
      console.log('Key:', orderRes.key);
      console.log('==============================');
      next: (orderRes: any) => {

  console.log("FULL RESPONSE");
  console.log(JSON.stringify(orderRes));

  console.log("TYPE OF AMOUNT");
  console.log(typeof orderRes.amount);

  console.log("TYPE OF CURRENCY");
  console.log(typeof orderRes.currency);

  console.log(orderRes);

}

      const options: any = {

        key: orderRes.key,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'Urban Nest',
        description: 'Order Payment',
        order_id: orderRes.orderId,

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },

        prefill: {
          name: 'Neha',
          contact: '7419119498'
        },

        handler: (response: any) => {

          console.log('==============================');
          console.log('PAYMENT SUCCESS');
          console.log('Razorpay Response:', response);
          console.log('Payment Id:', response.razorpay_payment_id);
          console.log('Order Id:', response.razorpay_order_id);
          console.log('Signature:', response.razorpay_signature);
          console.log('==============================');

          const verifyBody = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          };

          console.log('Verify Payload:', verifyBody);

          this.addressService.verifyPayment(verifyBody).subscribe({

            next: (verifyRes) => {

              console.log('==============================');
              console.log('PAYMENT VERIFIED');
              console.log('Verify Response:', verifyRes);
              console.log('==============================');

              const orderBody = {
                selectedProductIds: this.selectedProductIds,
                addressId: this.selectedAddressId
              };

              console.log('Order Body:', orderBody);

              this.addressService.placeOrder(orderBody).subscribe({

                next: (res: any) => {

                  console.log('==============================');
                  console.log('ORDER PLACED SUCCESSFULLY');
                  console.log(res);
                  console.log('==============================');

                  alert('✅ Payment successful and order placed');
                  this.router.navigate(['consumerNavbar/orders']);
                },

                error: (err) => {

                  console.log('==============================');
                  console.log('ORDER PLACEMENT FAILED');
                  console.log(err);
                  console.log('Status:', err.status);
                  console.log('Error:', err.error);
                  console.log('==============================');

                  alert(
                    err.error?.message ||
                    err.error ||
                    '❌ Order failed after payment'
                  );
                }
              });
            },

            error: (err) => {

              console.log('==============================');
              console.log('PAYMENT VERIFICATION FAILED');
              console.log(err);
              console.log('Status:', err.status);
              console.log('Error Body:', err.error);
              console.log('==============================');

              alert(JSON.stringify(err.error));
            }
          });
        },

        modal: {
          ondismiss: () => {
            console.log('User closed Razorpay popup');
            alert('Payment cancelled');
          }
        },

        theme: {
          color: '#C9A45C'
        }
      };

      console.log('Razorpay Options:', options);

      const Razorpay = (window as any).Razorpay;

      if (!Razorpay) {
        console.error('Razorpay SDK Missing');
        alert('Razorpay SDK not loaded. Please refresh the page.');
        return;
      }

      console.log('Opening Razorpay Checkout');

      const razorpay = new Razorpay(options);

      razorpay.on('payment.failed', function (response: any) {

        console.log('==============================');
        console.log('PAYMENT FAILED EVENT');
        console.log(response);
        console.log('Code:', response.error?.code);
        console.log('Description:', response.error?.description);
        console.log('Reason:', response.error?.reason);
        console.log('Metadata:', response.error?.metadata);
        console.log('==============================');

        alert(response.error?.description || 'Payment Failed');
      });

      razorpay.open();
    },

    error: (err) => {

      console.log('==============================');
      console.log('CREATE ORDER FAILED');
      console.log(err);
      console.log('Status:', err.status);
      console.log('Error Body:', err.error);
      console.log('==============================');

      alert(
        err.error?.message ||
        JSON.stringify(err.error) ||
        '❌ Failed to start payment'
      );
    }
  });
}
}