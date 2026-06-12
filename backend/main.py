"""
CloudGuard Lite — FastAPI Backend Entry Point
Run: uvicorn main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scan, upload, rules
from engine.slm import slm_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-warm the TF-IDF SLM vectorizer on startup."""
    print("🔧 Initializing SLM TF-IDF engine...")
    slm_engine.initialize()
    print(f"✅ SLM ready — {len(slm_engine.rules)} rules indexed.")
    yield
    print("👋 CloudGuard backend shutting down.")


app = FastAPI(
    title="CloudGuard Lite API",
    description="AI-powered cloud config vulnerability scanner",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js dev server + file:// origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "null",  # file:// origin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router,   prefix="/api", tags=["scan"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(rules.router,  prefix="/api", tags=["rules"])


@app.get("/")
async def root():
    return {
        "name": "CloudGuard Lite API",
        "version": "3.0.0",
        "rules": len(slm_engine.rules),
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "slm_ready": slm_engine._initialized}
