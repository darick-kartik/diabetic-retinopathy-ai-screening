
from fastapi import FastAPI, HTTPException
from sqlalchemy import text

from backend.app.database.connection import engine

from backend.app.routes.auth import router as auth_router
from backend.app.routes.patients import router as patients_router
from backend.app.routes.images import router as images_router
from backend.app.routes.predictions import router as predictions_router


app = FastAPI(
    title="Diabetic Retinopathy AI Screening API",
    description=(
        "Research prototype for diabetic retinopathy "
        "screening and report generation."
    ),
    version="1.0.0"
)


# Register API routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(images_router)
app.include_router(predictions_router)


@app.get("/")
def root():
    return {
        "message": "Diabetic Retinopathy AI Screening API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected"
            }
        )
