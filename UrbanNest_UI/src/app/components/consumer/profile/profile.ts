import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { ConsumerProfile } from '../../../interface/consumer-profile';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {

  profile!: ConsumerProfile;
  isEditMode = false;
  selectedImage: File | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private consumerService: Consumer,
    private router: Router,
    private chng: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.consumerService.getProfile().subscribe({
      next: (data: ConsumerProfile) => {
        this.profile = data;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  enableEdit() {
    this.isEditMode = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit() {
    this.isEditMode = false;
    this.selectedImage = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.loadProfile();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }

  goToChangePassword() {
    this.router.navigate(['/consumerNavbar/change-password']);
  }

  saveProfile() {
    this.errorMessage = '';
    this.successMessage = '';

    //  VALIDATION
    if (
      !this.profile.FirstName ||
      !this.profile.LastName ||
      !this.profile.Phone ||
      !this.profile.Gender ||
      !this.profile.Date_of_Birth
    ) {
      this.errorMessage = 'Please fill all fields before saving.';
      return;
    }

    const formData = new FormData();

    formData.append('FirstName', this.profile.FirstName);
    formData.append('LastName', this.profile.LastName);
    formData.append('Phone', this.profile.Phone);
    formData.append('Gender', this.profile.Gender);
    formData.append(
      'Date_of_Birth',
      new Date(this.profile.Date_of_Birth).toISOString()
    );

    if (this.selectedImage) {
      formData.append('profileimage', this.selectedImage);
    }

    this.consumerService.EditProfile(formData).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully ';
        this.isEditMode = false;
        this.selectedImage = null;
        this.loadProfile();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to update profile ❌';
      },
    });
  }
}