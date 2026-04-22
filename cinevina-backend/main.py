from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routes import movies, proxy, live

app = FastAPI(
    title="CINEVINA API",
    description="Backend for CINEVINA streaming platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://cinevina.vercel.app",  # Placeholder for frontend
        "https://cinevina-frontend.vercel.app", # Another placeholder
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movies.router)
app.include_router(proxy.router)
app.include_router(live.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to CINEVINA API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "cinevina-backend"}

@app.get("/health")
def health_check_legacy():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
