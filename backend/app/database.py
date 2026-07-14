import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings

# Resolve the absolute path of the backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'college_admission.db')}"
    WATSONX_API_KEY: str = ""
    WATSONX_PROJECT_ID: str = ""
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"
    WATSONX_MODEL_ID: str = "ibm/granite-3-8b-instruct"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    VECTORSTORE_PATH: str = os.path.join(BASE_DIR, "vectorstore", "faiss_index")
    KNOWLEDGE_BASE_DIR: str = os.path.join(BASE_DIR, "knowledge_base")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Load settings
settings = Settings()

# Setup database engine
# connect_args={"check_same_thread": False} is required only for SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
