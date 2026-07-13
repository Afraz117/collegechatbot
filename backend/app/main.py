import os
import shutil
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db, settings
from .models import FAQ, Fee, TimelineEvent, EligibilityRule, ConversationMessage, AdminStat
from .schemas import (
    FAQResponse, FeeResponse, TimelineResponse,
    EligibilityRequest, EligibilityResponse,
    CourseRecommendationRequest, CourseRecommendationResponse, RecommendationDetail,
    ConversationResponse, ChatRequest, ChatResponse, AdminDashboardStats
)
from .llm_service import LLMService
from .document_parser import DocumentParser
from .vectorstore_manager import VectorStoreManager

app = FastAPI(
    title="CampusConnect AI Backend",
    description="FastAPI Backend for Intelligent College Admission Agent using IBM Granite & RAG",
    version="1.0.0"
)

# Enable CORS for Next.js frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate services
llm_service = LLMService()
doc_parser = DocumentParser()
vector_manager = VectorStoreManager()

# Ensure directories exist
os.makedirs(settings.KNOWLEDGE_BASE_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)

# Helper function to increment stats
def increment_stat(db: Session, key: str, amount: int = 1):
    stat = db.query(AdminStat).filter(AdminStat.key == key).first()
    if not stat:
        stat = AdminStat(key=key, value=0)
        db.add(stat)
    stat.value += amount
    db.commit()

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Increment questions asked stat
    increment_stat(db, "questions_asked", 1)
    
    # 2. Retrieve contexts from vector store
    retrieved_docs = vector_manager.search_similarity(request.message, k=4)
    context_chunks = [doc.page_content for doc in retrieved_docs]
    sources = list(set([doc.metadata.get("source", "Unknown Document") for doc in retrieved_docs]))
    
    # 3. Generate answer using LLMService
    answer = llm_service.answer_question(request.message, context_chunks)
    
    # 4. Save to SQLite conversation history
    user_msg = ConversationMessage(session_id=request.session_id, role="user", content=request.message)
    assistant_msg = ConversationMessage(session_id=request.session_id, role="assistant", content=answer)
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()
    
    return ChatResponse(
        session_id=request.session_id,
        answer=answer,
        sources=sources
    )

@app.post("/api/courses/recommend", response_model=CourseRecommendationResponse)
def recommend_courses(request: CourseRecommendationRequest):
    try:
        raw_recommendation = llm_service.get_course_recommendations(
            marks=request.marks,
            interests=request.interests,
            career_goal=request.career_goal
        )
        
        # Parse the JSON response returned from the LLM service
        data = json.loads(raw_recommendation)
        
        recs = []
        for item in data.get("recommendations", []):
            recs.append(RecommendationDetail(
                department=item.get("department", "General"),
                reason=item.get("reason", "Highly suitable for your background"),
                match_percentage=item.get("match_percentage", 80)
            ))
            
        return CourseRecommendationResponse(recommendations=recs)
    except Exception as e:
        print(f"Error parsing recommendations: {e}")
        # Return fallback mock recommendations structured correctly
        mock_data = json.loads(llm_service._mock_course_recommendations(request.marks, request.interests, request.career_goal))
        recs = [
            RecommendationDetail(
                department=item["department"],
                reason=item["reason"],
                match_percentage=item["match_percentage"]
            )
            for item in mock_data["recommendations"]
        ]
        return CourseRecommendationResponse(recommendations=recs)

@app.post("/api/eligibility/check", response_model=EligibilityResponse)
def check_eligibility(request: EligibilityRequest, db: Session = Depends(get_db)):
    # Match rule in DB
    rule = db.query(EligibilityRule).filter(
        EligibilityRule.department.ilike(f"%{request.preferred_department}%"),
        EligibilityRule.board.ilike(request.board),
        EligibilityRule.community.ilike(request.community)
    ).first()
    
    # Generic fallback search if exact board/community match fails
    if not rule:
        rule = db.query(EligibilityRule).filter(
            EligibilityRule.department.ilike(f"%{request.preferred_department}%")
        ).first()

    if not rule:
        return EligibilityResponse(
            eligible=request.hsc_marks >= 75.0, # Default general criteria
            reason="Exact policy rule not found in database. Evaluated against general eligibility threshold of 75%.",
            min_required_marks=75.0,
            student_marks=request.hsc_marks
        )
        
    is_eligible = request.hsc_marks >= rule.min_percentage
    reason = (
        f"Congratulations! You are eligible for {rule.department}. The cutoff score for {rule.community} ({rule.board}) is {rule.min_percentage}%, and your score is {request.hsc_marks}%."
        if is_eligible else
        f"We regret to inform you that you do not meet the cutoff for {rule.department}. The required minimum score is {rule.min_percentage}%, but your score is {request.hsc_marks}%."
    )
    if rule.requirements:
        reason += f" Additional requirement: {rule.requirements}"
        
    return EligibilityResponse(
        eligible=is_eligible,
        reason=reason,
        min_required_marks=rule.min_percentage,
        student_marks=request.hsc_marks
    )

@app.get("/api/fees", response_model=List[FeeResponse])
def get_fees(db: Session = Depends(get_db)):
    return db.query(Fee).all()

@app.get("/api/timeline", response_model=List[TimelineResponse])
def get_timeline(db: Session = Depends(get_db)):
    return db.query(TimelineEvent).order_by(TimelineEvent.order_index.asc()).all()

@app.get("/api/faqs", response_model=List[FAQResponse])
def get_faqs(db: Session = Depends(get_db)):
    return db.query(FAQ).all()

@app.get("/api/search")
def search_documents(query: str = Query(..., min_length=1)):
    docs = vector_manager.search_similarity(query, k=5)
    return [
        {
            "content": doc.page_content,
            "source": doc.metadata.get("source", "Unknown Document")
        }
        for doc in docs
    ]

@app.post("/api/admin/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Ensure folder exists
    os.makedirs(settings.KNOWLEDGE_BASE_DIR, exist_ok=True)
    
    file_path = os.path.join(settings.KNOWLEDGE_BASE_DIR, file.filename)
    try:
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse file and generate chunks
        documents = doc_parser.parse_file(file_path)
        if not documents:
            raise HTTPException(status_code=400, detail="Document is empty or format is unsupported.")
            
        # Index chunks in vector store
        success = vector_manager.add_documents(documents)
        if not success:
            raise HTTPException(status_code=500, detail="Error indexing document in vector store.")
            
        # Update total document count
        doc_count = len(os.listdir(settings.KNOWLEDGE_BASE_DIR))
        stat = db.query(AdminStat).filter(AdminStat.key == "total_documents").first()
        if not stat:
            stat = AdminStat(key="total_documents", value=doc_count)
            db.add(stat)
        else:
            stat.value = doc_count
        db.commit()
        
        return {"filename": file.filename, "status": "success", "chunks_indexed": len(documents)}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.get("/api/admin/stats", response_model=AdminDashboardStats)
def get_admin_stats(db: Session = Depends(get_db)):
    # Get total document files count
    total_docs = 0
    if os.path.exists(settings.KNOWLEDGE_BASE_DIR):
        total_docs = len([f for f in os.listdir(settings.KNOWLEDGE_BASE_DIR) if os.path.isfile(os.path.join(settings.KNOWLEDGE_BASE_DIR, f))])
    
    # Sync with DB stats
    stat_docs = db.query(AdminStat).filter(AdminStat.key == "total_documents").first()
    if stat_docs:
        stat_docs.value = total_docs
    else:
        stat_docs = AdminStat(key="total_documents", value=total_docs)
        db.add(stat_docs)
    db.commit()

    q_asked_stat = db.query(AdminStat).filter(AdminStat.key == "questions_asked").first()
    q_asked = q_asked_stat.value if q_asked_stat else 0
    
    # FAQs as popular questions
    faqs = db.query(FAQ).limit(5).all()
    
    # Recent uploads
    recent_uploads = []
    if os.path.exists(settings.KNOWLEDGE_BASE_DIR):
        files = [f for f in os.listdir(settings.KNOWLEDGE_BASE_DIR) if os.path.isfile(os.path.join(settings.KNOWLEDGE_BASE_DIR, f))]
        # Sort files by modification time
        files.sort(key=lambda x: os.path.getmtime(os.path.join(settings.KNOWLEDGE_BASE_DIR, x)), reverse=True)
        recent_uploads = files[:5]
        
    return AdminDashboardStats(
        total_documents=total_docs,
        questions_asked=q_asked,
        popular_questions=faqs,
        recent_uploads=recent_uploads
    )

@app.get("/api/conversations", response_model=List[ConversationResponse])
def get_conversations(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(ConversationMessage).filter(
        ConversationMessage.session_id == session_id
    ).order_by(ConversationMessage.timestamp.asc()).all()
    return messages

@app.post("/api/admin/clear-vectorstore")
def clear_vectorstore(db: Session = Depends(get_db)):
    # 1. Clear files from knowledge base folder
    if os.path.exists(settings.KNOWLEDGE_BASE_DIR):
        for f in os.listdir(settings.KNOWLEDGE_BASE_DIR):
            file_path = os.path.join(settings.KNOWLEDGE_BASE_DIR, f)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Error deleting file {file_path}: {e}")
                
    # 2. Delete FAISS files
    vector_manager.delete_vectorstore()
    
    # 3. Reset document count stats
    stat = db.query(AdminStat).filter(AdminStat.key == "total_documents").first()
    if stat:
        stat.value = 0
        db.commit()
        
    return {"status": "success", "message": "All documents cleared and vector index deleted."}
