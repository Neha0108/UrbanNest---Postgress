import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Retailer } from '../../../interface/retailer';
import { Retailer as RetailerService } from '../../../service/retailer';

@Component({
  selector: 'app-retailer-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  private fb = inject(FormBuilder);
  private rservice = inject(RetailerService);

  form!: FormGroup;
  retailerProfile!: Retailer;

  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {

    this.form = this.fb.group({
      ShopName: [''],
      ShopDescription: [''],
      Address: [''],
      City: [''],
      State: [''],
      Pincode: [''],
      ContactNumber: [''],
      Email: [''],
      GSTNumber: [''],
      PANNumber: [''],
      BankAccountNumber: [''],
      IFSCCode: [''],
      AccountHolderName: ['']
    });

    this.loadProfile();
  }

  // ✅ LOAD PROFILE
  loadProfile() {
    this.loading = true;
    this.errorMessage = '';

    this.rservice.getProfile().subscribe({
      next: (res: any) => {

        this.retailerProfile = res;

        // ✅ mapping (because backend sends camelCase)
        this.form.patchValue({
          ShopName: res.shopName,
          ShopDescription: res.shopDescription,
          Address: res.address,
          City: res.city,
          State: res.state,
          Pincode: res.pincode,
          ContactNumber: res.contactNumber,
          Email: res.email,
          GSTNumber: res.gstNumber,
          PANNumber: res.panNumber,
          BankAccountNumber: res.bankAccountNumber,
          IFSCCode: res.ifscCode,
          AccountHolderName: res.accountHolderName
        });

        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  // ✅ UPDATE PROFILE
  update() {
    this.errorMessage = '';
    this.successMessage = '';

    this.rservice.updateProfile(this.form.value).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully ✅';
      },
      error: () => {
        this.errorMessage = 'Update failed ❌';
      }
    });
  }
}