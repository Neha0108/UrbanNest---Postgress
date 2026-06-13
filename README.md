# 🏡 UrbanNest - Modern Shopping Website

UrbanNest is a full-stack e-commerce platform designed for discovering and purchasing premium home decor, furniture, lighting, and lifestyle products. The application provides a seamless shopping experience for customers while offering powerful management tools for administrators and retailers.

---

## 🚀 Features

### 👤 Customer Features
- User Registration & Login
- Secure Authentication & Authorization
- Browse Products by Categories
- Product Search & Filtering
- Product Details Page
- Shopping Cart Management
- Wishlist Management
- Order Placement & Tracking
- User Profile Management
- Responsive User Interface

### 🏪 Retailer Features
- Retailer Dashboard
- Product Management
  - Add Products
  - Update Products
  - Delete Products
- Inventory Management
- Order Management
- Sales Analytics

### 🛡️ Admin Features
- User Management
- Retailer Approval & Management
- Product Monitoring
- Order Monitoring
- Dashboard Analytics
- Platform Management

---

## 🏗️ System Architecture

```text
Frontend (Angular)
        │
        ▼
ASP.NET Core Web API
        │
        ▼
 Entity Framework Core
        │
        ▼
      SQL Server
```

---

## 🛠️ Tech Stack

### Frontend
- Angular
- TypeScript
- HTML5
- CSS3
- Bootstrap

### Backend
- ASP.NET Core Web API
- C#
- Entity Framework Core

### Database
- SQL Server

### Authentication & Security
- JWT Authentication
- Role-Based Authorization

### Development Tools
- Visual Studio
- VS Code
- Git
- GitHub
- Postman

---

## 📂 Project Structure

```text
UrbanNest
│
├── Frontend (Angular)
│   ├── Components
│   ├── Services
│   ├── Models
│   └── Guards
│
├── Backend (ASP.NET Core)
│   ├── Controllers
│   ├── Services
│   ├── Repositories
│   ├── DTOs
│   ├── Models
│   └── Middleware
│
└── Database
    └── SQL Scripts
```

---

## 🔑 Key Modules

### Authentication Module
- User Registration
- Login
- JWT Token Generation
- Role-Based Access Control

### Product Module
- Product Catalog
- Product Categories
- Product Search
- Product Details

### Cart Module
- Add to Cart
- Remove from Cart
- Update Quantity
- Cart Summary

### Wishlist Module
- Save Products
- Remove Products
- Quick Product Access

### Order Module
- Place Orders
- Order History
- Order Tracking

### Dashboard Module
- Retailer Dashboard
- Sales Statistics
- Product Analytics

---

## 📸 Screenshots

### Home Page
![Home Page](Screenshots/home-page.png)

### Product Listing
![Products](Screenshots/products.png)

### Product Details
![Product Details](Screenshots/product-details.png)

### Shopping Cart
![Cart](Screenshots/cart.png)

### Retailer Dashboard
![Dashboard](Screenshots/dashboard.png)

> Replace the image paths with your actual screenshots.

---

## ⚙️ Installation & Setup

### Clone Repository

```bash
git clone https://github.com/Neha0108/UrbanNest.git
```

### Backend Setup

```bash
cd UrbanNest-Backend
```

Update connection string in:

```json
appsettings.json
```

Run migrations:

```bash
Update-Database
```

Run API:

```bash
dotnet run
```

---

### Frontend Setup

```bash
cd UrbanNest-Frontend
```

Install dependencies:

```bash
npm install
```

Run Angular application:

```bash
ng serve
```

Application will start at:

```text
http://localhost:4200
```

---

## 🗄️ Database Design

### Main Entities

- Users
- Retailers
- Products
- Categories
- Cart
- Wishlist
- Orders
- OrderItems

### Relationships

```text
User
 ├── Cart
 ├── Wishlist
 └── Orders

Retailer
 └── Products

Order
 └── OrderItems
```

---

## 🔒 Security Features

- JWT Authentication
- Password Encryption
- Protected Routes
- Role-Based Authorization
- Secure API Endpoints

---

## 📈 Future Enhancements

- Payment Gateway Integration
- Product Reviews & Ratings
- Coupon & Discount System
- Email Notifications
- AI-Based Product Recommendations
- Inventory Alerts
- Multi-Vendor Support
- Cloud Deployment

---

## 👩‍💻 Developer

**Neha Lamba**

Software Developer | Java | Spring Boot | ASP.NET Core | Angular

LinkedIn:
https://www.linkedin.com/in/neha-lamba-40bb16248/

GitHub:
https://github.com/Neha0108

---

## ⭐ Support

If you found this project helpful, please consider giving it a ⭐ on GitHub.
