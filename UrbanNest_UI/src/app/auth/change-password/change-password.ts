import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../service/user-service';
import { passwordStrengthValidator } from '../../validators/custom-validators';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css'],
})
export class ChangePassword {
  private userService = inject(UserService);
  private location = inject(Location);
  private fb = inject(FormBuilder);

  passwordForm!: FormGroup;

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  errorMessage = '';
  fieldErrors = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor() {
    this.initializeForm();
  }

  initializeForm() {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  submit() {
    this.errorMessage = '';
    this.message = '';
    this.fieldErrors = { oldPassword: '', newPassword: '', confirmPassword: '' };

    // Validate all fields before submission
    if (!this.oldPassword?.trim()) {
      this.fieldErrors.oldPassword = 'Current password is required';
      return;
    }

    if (!this.newPassword?.trim()) {
      this.fieldErrors.newPassword = 'New password is required';
      return;
    }

    if (this.newPassword.length < 8) {
      this.fieldErrors.newPassword = 'New password must be at least 8 characters';
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(this.newPassword);
    const hasLowerCase = /[a-z]/.test(this.newPassword);
    const hasDigit = /[0-9]/.test(this.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasDigit) {
      this.fieldErrors.newPassword = 'Password must contain uppercase, lowercase, and digits';
      return;
    }

    if (!this.confirmPassword?.trim()) {
      this.fieldErrors.confirmPassword = 'Please confirm your password';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.fieldErrors.confirmPassword = 'New password and confirm password do not match';
      return;
    }

    const formData = new FormData();
    formData.append('oldPassword', this.oldPassword);
    formData.append('newPassword', this.newPassword);
    formData.append('confirmPassword', this.confirmPassword);

    this.userService.changePassword(formData).subscribe({
      next: (response) => {
        this.message = typeof response === 'string' ? response : 'Password changed successfully ';
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.location.back(), 2000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error || err?.message || 'Failed to change password. Please try again.';
      },
    });
  }

  cancel() {
    this.location.back();
  }
}