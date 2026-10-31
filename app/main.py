from fastapi import FastAPI
from .db import Base, engine
from . import models  # noqa: F401 - ensures all models are registered
from .routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Member 3 - Products, Variants, Plans & Subscriptions API",
    version="1.0.0",
    description="Backend-only module for the hackathon project."
)
app.include_router(router, prefix="/api")


@app.get("/")
def health_check():
    return {"message": "Member 3 backend is running"}
