# Brightloop — Subscription Management System

> **Odoo x Make-A-Ton 9.0 | Kochi Hackathon 2026**

Brightloop is a subscription management platform designed to bring product and plan management, customer subscriptions, quotations, recurring billing, invoices, payments, and operational insights into one application.

🎥 **Project demonstration video:** [Watch Brightloop on YouTube](https://youtu.be/_TU6MMEWPt0)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Billing and Automation](#billing-and-automation)
- [Frontend and Backend Integration](#frontend-and-backend-integration)
- [Deployment Notes](#deployment-notes)
- [Security Notes](#security-notes)
- [Current Integration Notes](#current-integration-notes)
- [Contributors](#contributors)

---

## Overview

Brightloop helps businesses manage the complete subscription lifecycle. Administrators and staff can maintain products and plans, manage customer subscriptions, prepare quotations, generate invoices, record payments, and monitor subscription and billing activity.

The application is built with a React frontend and a FastAPI backend. The backend uses SQLAlchemy for database operations and SQLite for local development. Authentication is token-based, with role-based access control for protected operations.

## Key Features

### Product and Plan Management
- Create and manage products and product variants.
- Maintain pricing, billing periods, payment terms, and tax information.
- Configure subscription plans.
- Associate products and variants with subscription line items.

### Customer and Staff Management
- Customer registration and authentication.
- Staff and administrator accounts.
- Role-based access to application features.
- Customer-specific views for subscriptions and invoices.

### Subscription Management
- Create and manage customer subscriptions.
- Support subscription lifecycle statuses such as draft, quotation, confirmed, active, and closed.
- Activate subscriptions through the backend activation workflow.
- Track billing dates and subscription details.

### Quotations and Discounts
- Create quotations from subscription details.
- Manage quotation templates.
- Accept quotations through the quotation workflow.
- Configure fixed-value and percentage discounts, including eligibility and usage limits.

### Invoicing and Payments
- Generate invoices for subscriptions that are due for billing.
- Calculate line amounts, discounts, taxes, totals, and outstanding balances.
- Confirm, send, and cancel invoices according to business rules.
- Record payments using supported payment methods.
- Track paid, outstanding, and overdue invoice balances.

### Dashboard and Reporting
- View subscription and billing summaries.
- Review recurring revenue and subscription activity.
- Monitor upcoming renewals and invoice status.
- View payment and outstanding-balance information.

### Background Automation
- Run scheduled billing checks.
- Process subscriptions whose next invoice date is due.
- Advance subscription billing dates after invoice generation.
- Run subscription closing and overdue-reminder tasks where configured.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, JavaScript, Vite |
| Routing | React Router |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Databases | SQLite |
| Authentication | JWT, bcrypt |
| API | REST, JSON, HTTP |
| Frontend deployment | GitHub Pages / GitHub Actions |
| Backend API server | Uvicorn |

---

## System Architecture

```text
                 User / Browser
                       |
                       v
            React + Vite Frontend
                       |
             HTTPS REST API requests
              Authorization: Bearer JWT
                       |
                       v
                FastAPI Backend
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
   Authentication   Catalog       Billing
   and Customers   and Plans   and Invoices
        |              |              |
        +--------------+--------------+
                       |
                 SQLAlchemy ORM
                       |
             +---------+---------+
             |                   |
             v                   v
        member2.db           hackathon.db
   Users, customers,       Products, plans,
   reset tokens, logs      subscriptions,
                           invoices, payments
```

The backend currently uses two SQLite databases:

- **`member2.db`** — authentication-related records, users, customers, reset tokens, and audit information.
- **`hackathon.db`** — products, variants, plans, taxes, subscriptions, quotations, discounts, invoices, and payments.

The two databases are linked through the customer's username. They are not joined as a single database.

---

## Project Structure

```text
brightloop-integrated/
│
├── app/
│   ├── core/                 # Configuration, security and dependencies
│   ├── modules/
│   │   ├── customers/        # Customer-related functionality
│   │   ├── dashboard/        # Dashboard summaries
│   │   ├── discounts/        # Discount rules
│   │   ├── invoices/         # Invoice generation and billing automation
│   │   ├── payments/         # Payment records
│   │   ├── quotations/       # Quotations and templates
│   │   └── users/            # User-related functionality
│   ├── auth_api.py           # Authentication API
│   ├── auth_models.py        # Authentication database models
│   ├── db.py                 # Main application database
│   ├── main.py               # FastAPI application entry point
│   ├── models.py             # Product, plan and subscription models
│   ├── routes.py             # Catalog and subscription routes
│   ├── schemas.py            # Pydantic schemas
│   └── services.py           # Catalog and subscription services
│
├── frontend/
│   ├── src/
│   │   ├── api/              # API client and mock data
│   │   ├── auth/             # Authentication context and route guards
│   │   ├── components/       # Reusable UI components
│   │   ├── layout/           # Application layout and navigation
│   │   └── pages/            # Application pages
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── migrations/               # Database migration files
├── scripts/
│   └── seed_admin.py         # Create the initial administrator
├── .env.example              # Environment variable template
├── alembic.ini
├── BILLING_API.md            # Billing API reference
├── requirements.txt
├── seed.py                   # Optional demo data seeder
└── README.md
```

---

## Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.10 or later (Python 3.11 or 3.12 recommended).
- Node.js LTS and npm.
- Git.
- A terminal such as PowerShell, Command Prompt, or the VS Code terminal.

### 1. Clone the repository

```bash
git clone https://github.com/ItsNova07/Odoo-x-Make-A-Ton-9.0-Kochi-Hackathon-2026.git
cd Odoo-x-Make-A-Ton-9.0-Kochi-Hackathon-2026
```

If you are using a separately downloaded project folder, open a terminal at the folder containing `app/`, `frontend/`, and `requirements.txt`.

### 2. Create and activate a Python virtual environment

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation for the current terminal session, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install backend dependencies

Run this from the project root:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 4. Configure environment variables

Copy the example file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Open `.env` and set a strong, unique `JWT_SECRET`, plus the administrator account values. See [Environment Configuration](#environment-configuration).

### 5. Create the administrator account

After configuring `.env`, run:

```bash
python -m scripts.seed_admin
```

The script creates the first administrator using `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

### 6. (Optional) Add demonstration data

To populate the application with sample products, plans, subscriptions, quotations, invoices, and payment records:

```bash
python seed.py
```

Only run the seed script if you want sample data in the local database. The script checks whether the main database already contains data before seeding.

> **Warning:** `python seed.py --reset` deletes existing application data before reseeding. Do not use it on a database containing data you need to keep.

---

## Environment Configuration

The `.env.example` file is the template. Configure your own `.env` file locally.

| Variable | Purpose |
|---|---|
| `MEMBER2_DATABASE_URL` | Authentication/customer database connection string. Defaults to local SQLite. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. Must be private and unique. |
| `JWT_ALGORITHM` | JWT signing algorithm. The example uses `HS256`. |
| `JWT_ISSUER` | Expected JWT issuer. |
| `ACCESS_TOKEN_MINUTES` | Access-token lifetime in minutes. |
| `RESET_TOKEN_MINUTES` | Password-reset token lifetime in minutes. |
| `FRONTEND_URL` | Frontend URL used by backend flows that need to refer to the frontend. |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins. |
| `SMTP_HOST` | SMTP server hostname for email delivery. |
| `SMTP_PORT` | SMTP server port. |
| `MAIL_FROM` | Sender address used for application emails. |
| `ADMIN_USERNAME` | Initial administrator username. |
| `ADMIN_EMAIL` | Initial administrator email address. |
| `ADMIN_PASSWORD` | Initial administrator password. |
| `RATE_LIMIT_ENABLED` | Enables or disables configured rate-limiting behavior. |
| `AUTOMATION_ENABLED` | Enables scheduled automation when supported by the application settings. |
| `AUTOMATION_INTERVAL_HOURS` | Scheduler interval in hours. |
| `REMINDER_EVERY_DAYS` | Reminder interval in days. |

The primary application database is configured in `app/db.py` as `hackathon.db`. The authentication database is configured through `MEMBER2_DATABASE_URL`.

Generate a strong secret rather than using the example placeholder. For example, with Python:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the generated value into your local `.env` as `JWT_SECRET`.

---

## Running the Application

Run the backend and frontend in separate terminals.

### Terminal 1 — Start the FastAPI backend

From the project root, with the virtual environment activated:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

- API base: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/api/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`
- Alternative API documentation: `http://127.0.0.1:8000/redoc`

### Terminal 2 — Start the React frontend

Open a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Vite normally serves the frontend at:

`http://localhost:5173`

The Vite development configuration proxies `/api` requests to the backend at `http://localhost:8000`.

For local development, keep both servers running.

---

## API Documentation

The FastAPI Swagger UI is the most reliable, up-to-date reference for the routes exposed by the running backend:

`http://127.0.0.1:8000/docs`

The API uses JSON request and response bodies. Protected endpoints require a bearer token:

```http
Authorization: Bearer <access_token>
```

The frontend API client is located at:

`frontend/src/api/api.js`

The billing API reference is available in:

`BILLING_API.md`

### Main API areas

| Area | Example route | Purpose |
|---|---|---|
| Authentication | `/api/auth/login` | Sign in and obtain an access token |
| Catalog | `/api/products` | Product management |
| Plans | `/api/plans` | Plan management |
| Subscriptions | `/api/subscriptions` | Subscription management |
| Dashboard | `/api/dashboard/subscriptions` | Subscription metrics |
| Quotations | `/api/quotations` | Quotation management |
| Discounts | `/api/discounts` | Discount management |
| Billing | `/api/billing/run` | Run due billing |
| Invoices | `/api/invoices` | Invoice management |
| Payments | `/api/payments` | Payment records |
| Customer portal | `/api/me/invoices` | Invoices for the authenticated customer |
| Health | `/api/health` | Backend health check |

The exact request fields, response models, filters, and permissions should be checked in `/docs` and `BILLING_API.md`.

---

## User Roles

The backend applies role-based authorization to protected routes.

| Role | Typical access |
|---|---|
| **Admin** | Administrative operations, staff/customer management, catalog and plan administration, discounts, billing and reporting. |
| **Staff** | Operational workflows such as customer/subscription handling, quotations, invoices, payments and permitted reports. |
| **Customer** | Customer portal operations and access to their own subscription and invoice information. |

Access is enforced by the backend. Hiding a menu item in the frontend is not a substitute for API authorization.

---

## Billing and Automation

The billing engine processes active subscriptions whose next invoice date is due.

At a high level, the billing process:

1. Finds active subscriptions due for billing.
2. Creates an invoice for the relevant billing period.
3. Copies subscription line details into invoice lines.
4. Calculates discounts, taxes, totals, and due dates.
5. Advances the subscription's next invoice date.
6. Prevents duplicate invoices for the same subscription and billing period through database-level safeguards.

The backend also includes an automation scheduler for recurring billing-related tasks and overdue reminders. Scheduled work runs while the backend process is running. For production, use a persistent backend host and configure email/SMTP settings if email reminders are required.

A manual billing run is available through:

```http
POST /api/billing/run
```

This endpoint requires an authorized admin or staff account.

---

## Frontend and Backend Integration

### Local development

The frontend uses the Vite proxy configured in `frontend/vite.config.js`:

```javascript
server: {
  port: 5173,
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
}
```

This proxy is for local development only. It does not proxy requests after the frontend is built and deployed as static files.

### Production

For a deployed frontend, the browser must call a publicly reachable backend HTTPS URL. Configure the frontend's build-time API URL using the environment variable supported by its API client, such as `VITE_API_URL`, and rebuild the frontend.

Example:

```env
VITE_API_URL=https://your-backend-domain.example/api
```

The backend's `CORS_ORIGINS` must include the exact frontend origin, for example:

```env
CORS_ORIGINS=https://your-frontend-domain.example
```

Do not use `localhost` as the production API URL. In a visitor's browser, `localhost` refers to that visitor's own device.

---

## Deployment Notes

### Frontend

The frontend is a Vite application and can be built with:

```bash
cd frontend
npm ci
npm run build
```

The production files are generated in:

`frontend/dist/`

The repository includes a GitHub Actions workflow at:

`.github/workflows/deploy-brightloop.yml`

The workflow builds the frontend and publishes the build output to GitHub Pages. GitHub Pages hosts only static frontend files; it does not run the FastAPI backend or host the SQLite databases.

### Backend

Deploy the FastAPI application separately to a server or hosting platform that supports Python applications and persistent database storage.

For production:
- Use HTTPS.
- Configure a persistent database location or managed database.
- Set production environment variables in the hosting provider's secret/configuration settings.
- Configure CORS for the deployed frontend origin.
- Configure SMTP if email delivery is needed.
- Ensure the backend process remains running for scheduled automation.
- Back up the database regularly.

---

## Security Notes

- Never commit `.env`, database files, passwords, JWT secrets, access tokens, or private keys.
- Keep `.env.example` limited to safe placeholders.
- Use a strong, unique `JWT_SECRET` in every environment.
- Use HTTPS for production frontend and backend traffic.
- Do not trust customer usernames or role values supplied by the browser; the backend must derive identity and permissions from verified authentication.
- Do not store raw card details in the application. Use a compliant payment provider for real card processing.
- Restrict database and log access, and back up persistent data.
- Do not expose development credentials or demo accounts in a public deployment.

---

## Current Integration Notes

The frontend API client contains mock-data switches in `frontend/src/api/api.js`. Review the `MOCK` configuration before presenting the application as fully live. Any feature left in mock mode will display sample data rather than reading from the backend.

The current frontend API client marks customer subscription details (`mySubscription`) and payment-method functionality (`payments`) as mock-enabled. Confirm whether these are still intended to be demo-only before a production release.

The customer self-service payment-method and plan-change experiences may require additional backend routes or a payment-provider integration. Check the current API implementation and `/docs` before promising those capabilities as live.

---

## Contributors

Built collaboratively by the Brightloop team for **Odoo x Make-A-Ton 9.0 — Kochi Hackathon 2026**.

---

## Project Demonstration

Watch the project walkthrough:

▶️ [Brightloop — Project Demo Video](https://youtu.be/_TU6MMEWPt0)

---

<p align="center">
  <strong>Brightloop</strong><br/>
  Simplifying subscription management, billing, and customer operations.
</p>
