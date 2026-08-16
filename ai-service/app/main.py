import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as ai_router
from app.utils.logger import logger

app = FastAPI(
    title="BaghNetra AI Microservice",
    description="Offline-capable Neural Camera Trap Triage & Tiger Re-Identification API for Pench Tiger Reserve",
    version="1.0.0"
)

# Enable CORS for local MERN stack integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/")
async def root():
    return {
        "system": "BaghNetra AI Microservice",
        "jurisdiction": "Pench Tiger Reserve",
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting BaghNetra AI FastAPI server on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
