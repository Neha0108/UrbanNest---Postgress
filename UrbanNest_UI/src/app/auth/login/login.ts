import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/user-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  errorMessage = '';

  loginForm = this.fb.group({
  UserEmail: ['', [Validators.required, Validators.email]],
  UserPassword: ['', Validators.required]
});

  private getUserRoleFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.role) return payload.role;
      if (payload.Role) return payload.Role;

      const roleClaim =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      if (Array.isArray(roleClaim)) return roleClaim[0];
      if (typeof roleClaim === 'string') return roleClaim;

      return null;
    } catch {
      return null;
    }
  }

submit(): void {
  if (this.loginForm.invalid) return;

  const { UserEmail, UserPassword } = this.loginForm.value as { UserEmail: string; UserPassword: string };

  this.userService.loginUser(UserEmail, UserPassword).subscribe({
    next: (response) => {
      const token = response.token;
      localStorage.setItem('token', token);
      localStorage.setItem('role', this.getUserRoleFromToken(token) || '');

      const role = this.getUserRoleFromToken(token);

      if (role === 'Retailer') {
        this.router.navigateByUrl('/retailerNavbar/retailerdashboard',{replaceUrl: true });
      }
      else if (role === 'Consumer') {
        this.router.navigateByUrl('/consumerNavbar/home',{replaceUrl: true });
      }
      else if (role === 'Admin') {
        this.router.navigate(['/admin']);
      }
      else {
        localStorage.clear();
        this.router.navigateByUrl('/login',{replaceUrl: true });
      }
    },
    error: () => {
      this.errorMessage = 'Invalid email or password';
    }
  });
}
}