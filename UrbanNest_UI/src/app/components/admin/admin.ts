import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RoleService } from '../../service/role-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../service/adminservice';
import { Category } from '../../interface/category';
import { Role } from '../../interface/role';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {

  activeTab = 'consumers';

  consumers: any[] = [];
  filteredConsumers: any[] = [];

  retailers: any[] = [];
  categories: Category[] = [];
  roles: Role[] = [];

  newCategory = { categoryName: '' };
  newRole = { name: '' } as Role;

  successMessage = '';
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private roleService: RoleService,
    private router: Router,
    private chng: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadConsumers();
  }

  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  // ======================
  //  CONSUMERS
  // ======================
  loadConsumers() {
    this.activeTab = 'consumers';
    this.scrollToTop();

    this.adminService.getConsumers().subscribe({
      next: (res: any) => {
        this.consumers = res;
        this.filteredConsumers = res;
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to load consumers'
    });
  }

  filterUsers(type: string) {
    if (type === 'all') this.filteredConsumers = this.consumers;
    else if (type === 'active')
      this.filteredConsumers = this.consumers.filter(u => u.status === 'Active');
    else
      this.filteredConsumers = this.consumers.filter(u => u.status === 'Blocked');
  }

  // ======================
  //  RETAILERS
  // ======================
  loadRetailers() {
    this.activeTab = 'retailers';
    this.scrollToTop();
    this.adminService.getRetailers().subscribe({
      next: (res: any) => {
        this.retailers = res;
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to load retailers'
    });
  }

  blockUser(id: number) {
    this.adminService.blockUser(id).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        this.reloadCurrentTab();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to update user'
    });
  }

  // ======================
  //  CATEGORY
  // ======================
  loadCategories() {
    this.activeTab = 'category';

    this.adminService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res;
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to load categories'
    });
  }

  addCategory() {
    if (!this.newCategory.categoryName.trim()) return;

    this.adminService.addCategory(this.newCategory).subscribe({
      next: () => {
        this.successMessage = 'Category added';
        this.newCategory.categoryName = '';
        this.loadCategories();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to add category'
    });
  }

  deleteCategory(id: number) {
    this.adminService.deleteCategory(id).subscribe({
      next: () => {
        this.successMessage = 'Category deleted';
        this.loadCategories();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to delete category'
    });
  }

  // ======================
  //  ROLE
  // ======================
  loadRoles() {
    this.activeTab = 'roles';
    this.scrollToTop();

    this.roleService.getRole().subscribe({
      next: (res: Role[]) => {
        this.roles = res;
        console.log(this.roles);
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to load roles'
    });
  }

  addRole() {
    if (!this.newRole.name.trim()) return;
    this.roleService.addRole(this.newRole).subscribe({
      next: () => {
        this.successMessage = 'Role added';
        this.newRole.name = '';
        this.loadRoles();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to add role'
    });
  }

  deleteRole(id: number) {
    this.roleService.deleteRole(id).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        this.loadRoles();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to delete role'
    });
  }

  // ======================
  //  HELPERS
  // ======================
  reloadCurrentTab() {
    if (this.activeTab === 'consumers') this.loadConsumers();
    if (this.activeTab === 'retailers') this.loadRetailers();
    if (this.activeTab === 'category') this.loadCategories();
    if (this.activeTab === 'roles') this.loadRoles();
  }

  // ======================
  //  LOGOUT
  // ======================
  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
}