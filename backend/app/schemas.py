from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# FAQ Schemas
class FAQBase(BaseModel):
    question: str
    answer: str
    category: str = "General"

class FAQCreate(FAQBase):
    pass

class FAQResponse(FAQBase):
    id: int

    class Config:
        from_attributes = True

# Fee Schemas
class FeeBase(BaseModel):
    name: str
    value: float
    category: str
    description: Optional[str] = None

class FeeResponse(FeeBase):
    id: int

    class Config:
        from_attributes = True

# Timeline Schemas
class TimelineBase(BaseModel):
    event_name: str
    date_range: str
    description: Optional[str] = None
    order_index: int = 0

class TimelineResponse(TimelineBase):
    id: int

    class Config:
        from_attributes = True

# Eligibility Check Schemas
class EligibilityRequest(BaseModel):
    hsc_marks: float = Field(..., ge=0, le=100, description="HSC percentage marks (0-100)")
    board: str = Field(..., description="E.g., State Board, CBSE, ICSE")
    community: str = Field(..., description="E.g., OC, OBC, BC, SC, ST")
    preferred_department: str = Field(..., description="E.g., AI & DS, Computer Science")

class EligibilityResponse(BaseModel):
    eligible: bool
    reason: str
    min_required_marks: float
    student_marks: float

# Course Recommendation Schemas
class CourseRecommendationRequest(BaseModel):
    marks: float = Field(..., ge=0, le=100, description="Academic performance indicator (0-100)")
    interests: str = Field(..., description="E.g., Programming, Hardware, Math, Designing")
    career_goal: str = Field(..., description="E.g., Software Engineer, Data Scientist, Network Admin")

class RecommendationDetail(BaseModel):
    department: str
    reason: str
    match_percentage: float

class CourseRecommendationResponse(BaseModel):
    recommendations: List[RecommendationDetail]

# Conversation Message Schemas
class ConversationBase(BaseModel):
    session_id: str
    role: str
    content: str

class ConversationResponse(ConversationBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Chat Request / Response Schemas
class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: List[str] = []

# Admin Dashboard Stats
class AdminDashboardStats(BaseModel):
    total_documents: int
    questions_asked: int
    popular_questions: List[FAQResponse]
    recent_uploads: List[str]
