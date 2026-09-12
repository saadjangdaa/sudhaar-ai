import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.api_report import router as api_report_router
from routes.reports import router as reports_router
from routes.verify import router as verify_router

load_dotenv()

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(
    title="Civic Issue Routing Agent",
    description="Karachi civic reporting backend with LangGraph multi-agent pipeline (OpenAI)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_report_router)
app.include_router(reports_router)
app.include_router(verify_router)


@app.get("/health")
def health():
    return {"status": "ok"}
