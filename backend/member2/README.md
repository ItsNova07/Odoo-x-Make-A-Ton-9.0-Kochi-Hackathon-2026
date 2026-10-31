# Member 2: users, customers, auth (`backend/member2`)

Own SQLite DB (`member2.db`, git-ignored) managed by Alembic. Nothing here touches Member 3's `hackathon.db`.

## Run
From the repository root, enter this folder first:
```
cd backend/member2
```
Then run:
```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # set JWT_SECRET (required) and your own ADMIN_* values
alembic upgrade head              # creates member2.db
python -m scripts.seed_admin      # first admin, from your .env (no credentials in source)
mailpit                           # SMTP :1025, inbox http://localhost:8025
uvicorn app.main:app --reload     # http://localhost:8000/docs -> Authorize with your admin
```
Run Mailpit in a separate terminal. Test files are not included in this branch commit.
In the merged app, the owner of the shared `main.py` only needs `app.include_router(api_router)` (`from app.api import api_router`).

## Answers for Member 4 (and everyone)
1. **customers table:** `id, user_id (unique, nullable FK users.id), username (unique, lowercase, immutable), name, email, phone, address_line1, address_line2, city, state, postal_code, country, is_active, created_at, updated_at`.
2. **Linked to users?** Yes, `customers.user_id -> users.id` (inside this DB only). **Across databases the key is `username`**, so store it as `customer_username` in quotations, subscriptions and invoices. Never store `user_id` or `customers.id` elsewhere.
3. **Roles:** `admin`, `staff`, `customer` (exact lowercase strings).
4. **`app/core/deps.py`:**
   - `get_identity` is JWT only (no DB) and returns `TokenIdentity(username, role, user_id)`.
   - `get_current_user` checks the JWT and the DB, so the user must exist and be active.
   - `require_role("admin")` or `require_role("admin", "staff")` returns 401 if not logged in and 403 if the role is wrong.
   - Example: `def create_tax(..., user=Depends(require_role("admin")))`.
5. **Customer helpers for the portal:**
   - `current_customer_username` returns the logged-in customer's username from the JWT, with no DB access. Use it for `/api/me/subscriptions` and `/api/me/invoices`:
     `def my_invoices(u: str = Depends(current_customer_username), db=Depends(get_db)): ... .where(Invoice.customer_username == u)`
   - `current_customer` returns the full `Customer` row (Member 2 profile pages).
   - Never trust a username sent by the browser.
   - To validate a username from staff-side code (e.g. creating a quotation), call `GET /api/customers/by-username/{username}` (admin/staff), which returns 404 if it doesn't exist. Don't join the two databases.
6. **`app/core/database.py` and `app/core/config.py`:** yes. `Base`, `get_db`, `SessionLocal` and `make_engine(url)` live in `app.core.database`. For your own DB, call `make_engine()` with your own URL and a separate `Base`; don't reuse Member 2's `Base`, so Alembic stays per-DB.
7. **Email helper:** `app.core.email.send_email(to, subject, body, attachments=[(filename, bytes, "application/pdf")]) -> bool`. It never raises, so record `False` as a failed send. Uses Mailpit via `SMTP_HOST/PORT`.
8. **Admin for testing:** there is no default login in the code or in /docs. Put your own `ADMIN_USERNAME/EMAIL/PASSWORD` in your local `.env`, run `python -m scripts.seed_admin`, then use **Authorize** in /docs (username or email + password).

## JWT
`Authorization: Bearer <jwt>`. Claims: `sub` = **username**, `uid`, `role`, `iss`, `iat`, `exp` (60 min). The signature is verified with `JWT_SECRET` (same value in the merged app). The DB-backed guards re-read role and is_active on every request; `get_identity` and `current_customer_username` trust the token for up to 60 minutes. Logout is client-side (delete the token).

## Errors
FastAPI default `{"detail": "..."}`; validation errors are 422 with a `detail` list. 401 = not logged in, 403 = not allowed, 409 = username/email taken, 429 = rate limited.

## Endpoints
| Route | Access |
|---|---|
| POST /api/auth/signup, /login (`identifier` = username or email), /token (form, for /docs), /forgot-password, /reset-password | public |
| GET /api/auth/me | logged in |
| POST/GET /api/users/staff, PATCH /api/users/{id}/active | admin |
| GET/POST /api/customers, DELETE /api/customers/{id}, GET /api/customers/by-username/{username} | admin, staff |
| GET/PATCH /api/customers/{id} | admin/staff; customer only own (name, phone, address) |
| GET/PATCH /api/me/customer | customer |

## Open items for the team
- One shared `main.py` owner and one backend layout (this package currently runs standalone from `backend/member2`).
- The scaffold put `username` on `customers` too (so staff-created customers without a login still have a reference key); confirm this is okay.
- Staff-created customers have no login yet (`has_login: false`). A "create login for customer" flow is not built.
- Update the shared docs: the stack image still says PostgreSQL.
