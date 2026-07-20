# 🏠 UrbanNest

A full-stack e-commerce platform with role-based experiences for Consumers, Retailers, and Admins — featuring an AI-powered shopping assistant, integrated payments, and a coupon engine with real business rules.

![Status](https://img.shields.io/badge/status-in--development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- **Role-based access** — Consumer, Retailer, and Admin experiences with JWT authentication and Google OAuth
- **AI Shopping Assistant** — Google Gemini-powered chatbot that grounds product recommendations against real database records (no hallucinated products)
- **Coupon Engine** — Full business-rule validation: expiry dates, usage limits, percentage caps, retailer-scoped discounts
- **Checkout & Payments** — Multi-step checkout flow integrated with Razorpay
- **Order Management** — Real-time order status updates with delivery tracking and notification triggers
- **Notifications** — Transactional emails via SMTP and in-app notification system
- **Retailer Dashboard** — Sales analytics, product management, order fulfillment, customer reviews
- **Wishlist & Cart** — Full consumer shopping flow with persistent cart and wishlist
- **Responsive Design System** — Custom design tokens (CSS custom properties) for consistent theming across all zones

---

## 🖼️ Screenshots

| Guest Landing | Consumer Shopping |
|---|---|
| ![Guest Landing](./docs/screenshots/guest-landing.png) | ![Shopping Flow](./docs/screenshots/shopping-flow.png) |

| Smart Features (AI + Notifications) | Retailer Dashboard |
|---|---|
| ![Smart Features](./docs/screenshots/smart-features.png) | ![Retailer Dashboard](./docs/screenshots/retailer-dashboard.png) |

> Place the collage images in `docs/screenshots/` and update the paths above to match.

---

## 🛠️ Tech Stack

**Backend**
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL (hosted via Supabase)
- JWT Authentication + Google OAuth
- Razorpay (payments)
- SMTP (transactional email)
- Google Gemini API (AI chatbot)

**Frontend**
- Angular (standalone components)
- CSS custom properties for design tokens

**Architecture**
- Repository → Service → Controller pattern
- Interfaces in `Repository/`, implementations in `Service/`
- JWT claims resolved server-side (`User.FindFirst(ClaimTypes.NameIdentifier)`), never trusted from the frontend

---

## 📂 Project Structure

```
UrbanNest/
├── UrbanNest.API/              # ASP.NET Core Web API
│   ├── Controllers/
│   ├── Repository/             # Interfaces
│   ├── Service/                # Implementations
│   ├── Models/
│   ├── DTOs/
│   └── JsonWebToken/
├── urban-nest-frontend/        # Angular application
│   ├── src/app/
│   │   ├── consumer/
│   │   ├── retailer/
│   │   ├── admin/
│   │   └── shared/
│   └── src/environments/
└── docs/
    └── screenshots/
```

> Adjust this tree to match your actual folder names if they differ.

---

## 🚀 Getting Started

### Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) (8.0 or later)
- [Node.js](https://nodejs.org/) (v18+) and npm
- [Angular CLI](https://angular.dev/tools/cli): `npm install -g @angular/cli`
- A PostgreSQL database (e.g. via [Supabase](https://supabase.com))
- A Google Cloud project with OAuth 2.0 credentials
- A Razorpay account (test/live API keys)
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/UrbanNest.git
cd UrbanNest
```

### 2. Backend setup

```bash
cd UrbanNest.API
```

Create a `secrets.json` (or use `dotnet user-secrets`) with the following keys — **never commit real secrets to the repo**:

```json
{
  "ConnectionStrings:DefaultConnection": "Host=...;Database=...;Username=...;Password=...",
  "Jwt:Key": "your-jwt-signing-key",
  "Jwt:Issuer": "UrbanNest",
  "Jwt:Audience": "UrbanNestUsers",
  "GoogleAuth:ClientId": "your-google-oauth-client-id",
  "Razorpay:KeyId": "your-razorpay-key-id",
  "Razorpay:KeySecret": "your-razorpay-key-secret",
  "Gemini:ApiKey": "your-gemini-api-key",
  "Smtp:Host": "smtp.example.com",
  "Smtp:Port": "587",
  "Smtp:Username": "your-smtp-username",
  "Smtp:Password": "your-smtp-password"
}
```

Run migrations and start the API:

```bash
dotnet restore
dotnet ef database update
dotnet run
```

The API will start at `https://localhost:5146` (or the port configured in `launchSettings.json`).

### 3. Frontend setup

```bash
cd ../urban-nest-frontend
npm install
```

Update `src/environments/environment.ts` with your backend URL and Google OAuth client ID:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5146/api',
  googleClientId: 'your-google-oauth-client-id'
};
```

**Important:** In Google Cloud Console → Credentials → your OAuth Client ID, add the exact origin you're running the frontend on (e.g. `http://localhost:4200`) to **Authorized JavaScript origins**. Google rejects mismatched origins (`localhost` vs `127.0.0.1` are treated as different origins), which will break login.

Run the frontend:

```bash
ng serve
```

The app will be available at `http://localhost:4200`.

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Consumer** | Browse products, cart, wishlist, checkout, order tracking, AI chatbot |
| **Retailer** | Product management, order fulfillment, coupons, reviews, sales dashboard |
| **Admin** | Platform-wide management *(in progress)* |

---

## 🗺️ Roadmap

- [ ] Complete Admin panel (dashboard, analytics, management modules)
- [ ] Add `[Authorize]` to remaining unprotected controller actions
- [ ] Consolidate legacy dark-theme CSS still present in some component files
- [ ] Remove unused Angular Material dependency
- [ ] Expand automated test coverage

---

## ⚠️ Known Issues

- Some components still contain unused legacy CSS from an earlier theme (visually inert, flagged for cleanup)
- A few controller actions are missing explicit `[Authorize]` attributes — audit in progress

---

## 🔒 Security Note

If you're forking or deploying this project, make sure to:
- Rotate any database credentials before making the repository public
- Never commit `secrets.json`, `.env`, or API keys — add them to `.gitignore`
- Review all controllers for missing `[Authorize]` attributes before production deployment

---

## 🤝 Contributing

This is a personal learning project, but suggestions and feedback are welcome — feel free to open an issue or a pull request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## 📬 Contact

Built by Neha — feel free to connect on [LinkedIn](#) or reach out via GitHub issues.
