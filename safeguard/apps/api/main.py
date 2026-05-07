from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import sos, threat, module3, auth, admin, onboarding, profiles

app = FastAPI(
    title="SafeGuard API",
    description="AI-powered safety platform for Women & Children",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(profiles.router)
app.include_router(sos.router)
app.include_router(threat.router)
app.include_router(module3.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to SafeGuard API",
        "status": "running",
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
