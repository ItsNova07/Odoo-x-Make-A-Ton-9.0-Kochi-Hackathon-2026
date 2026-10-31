from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import event

from app import models  # noqa: F401  Member 3: products, variants, plans, taxes, subscriptions
from app.db import Base, engine
from app.modules.discounts import models as discount_models  # noqa: F401
from app.modules.discounts.router import router as discounts_router
from app.modules.invoices import models as invoice_models  # noqa: F401
from app.modules.invoices.router import router as invoices_router
from app.modules.payments import models as payment_models  # noqa: F401
from app.modules.payments.router import router as payments_router
from app.routes import router as catalog_router


# SQLite ignores foreign keys unless this is switched on for every connection
@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    if engine.url.get_backend_name() == "sqlite":
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Brightloop API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog_router, prefix="/api")
app.include_router(discounts_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")
app.include_router(payments_router, prefix="/api")


@app.get("/")
def health_check():
    return {"message": "Brightloop API is running"}
