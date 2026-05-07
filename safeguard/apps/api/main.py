from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, sos, guardian, zones

app = FastAPI(title="SafeGuard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(sos.router)
app.include_router(guardian.router)
app.include_router(zones.router)

@app.get("/")
async def root():
    return {"message": "Welcome to SafeGuard API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
