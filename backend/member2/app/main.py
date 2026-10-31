"""Standalone dev app so Member 2 can test in /docs. In the merged project, the shared
main.py just includes app.api.api_router instead."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router
from .core.config import get_settings

app = FastAPI(title="Brightloop Subscription Management: users & customers")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in get_settings().cors_origins.split(",")],
    allow_methods=["*"], allow_headers=["*"],
)
app.include_router(api_router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
