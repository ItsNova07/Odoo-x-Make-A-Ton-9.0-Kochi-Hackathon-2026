# Member 3 Backend: Products, Variants, Plans & Subscriptions

Backend-only FastAPI module using SQLite + SQLAlchemy. No frontend is included.

## 1. Setup

Use Python 3.10 or newer.

### Windows PowerShell

```powershell
cd member3_backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If PowerShell blocks activation, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
```

## 2. Test the API

Open **http://127.0.0.1:8000/docs** in your browser. Use the Swagger UI to test endpoints.

The SQLite database file `hackathon.db` is created in the folder from which you run Uvicorn. It persists between restarts.

## 3. Main endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET, POST | `/api/products` | List/create products |
| GET, PATCH, DELETE | `/api/products/{id}` | Read/update/delete product |
| GET, POST | `/api/variants` | List/create variants |
| PATCH, DELETE | `/api/variants/{id}` | Update/delete variant |
| GET, POST | `/api/plans` | List/create plans |
| GET, PATCH, DELETE | `/api/plans/{id}` | Read/update/delete plan |
| GET, POST | `/api/taxes` | List/create taxes |
| GET, POST | `/api/subscriptions` | List/create subscriptions |
| GET, PATCH | `/api/subscriptions/{id}` | Read/update subscription |
| POST | `/api/subscriptions/{id}/activate` | Activate subscription |

## 4. Important agreed rules

- Subscription statuses: `draft`, `quotation`, `confirmed`, `active`, `closed`.
- Billing periods: `daily`, `weekly`, `monthly`, `yearly`.
- `payment_terms` is an integer number of days (0 means immediate).
- Tax is attached per subscription line using `tax_id`.
- `subscription_lines.unit_price` is a price snapshot and should include product base price + selected variant extra.
- First activation sets `start_date` (if missing) and `next_invoice_date` to the same date. Re-activating an already active subscription does not reset the invoice date.
- Billing logic should advance `next_invoice_date` later; this starter intentionally does not implement invoice generation.

## 5. Example request bodies

Create a product:
```json
{
  "name": "Wireless Headphones",
  "description": "Bluetooth headphones",
  "category": "Electronics",
  "base_price": "2499.00",
  "is_active": true
}
```

Create a variant (use the product ID returned above):
```json
{
  "product_id": 1,
  "name": "Black",
  "sku": "WH-BLK",
  "attributes": {"color": "Black"},
  "price_extra": "200.00",
  "stock": 25,
  "is_active": true
}
```

Create a plan:
```json
{
  "name": "Premium Monthly",
  "description": "Monthly premium plan",
  "price": "999.00",
  "billing_period": "monthly",
  "payment_terms": 15,
  "features": ["Priority support", "Unlimited access"],
  "is_active": true
}
```

Create a tax:
```json
{
  "name": "GST 18%",
  "rate": "18.00",
  "is_active": true
}
```

Create a subscription with a line:
```json
{
  "subscription_number": "SUB-0001",
  "customer_name": "Test Customer",
  "customer_email": "test@example.com",
  "plan_id": 1,
  "status": "draft",
  "payment_terms": 15,
  "notes": "Demo subscription",
  "lines": [
    {
      "product_id": 1,
      "variant_id": 1,
      "description": "Wireless Headphones - Black",
      "quantity": 2,
      "unit_price": "2699.00",
      "tax_id": 1
    }
  ]
}
```

Activate:
`POST /api/subscriptions/1/activate`

## 6. Integration notes

- Import `app.models` and `app.db.Base` into the main backend if your team uses a shared SQLAlchemy database.
- If your teammate already has a central FastAPI app and database session, do not run this module's `main.py` as a second server. Instead include `app.routes.router` in the main app and align the database Base/session configuration.
- Agree on a single shared database and avoid creating duplicate `Base` classes or separate database files during integration.
- This is a hackathon starter, not a production billing system. Authentication, migrations, invoice generation, payment processing and audit logging are not included.
