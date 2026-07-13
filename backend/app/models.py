from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from .database import Base

class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String, default="General")

class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    category = Column(String, nullable=False) # e.g., Tuition, Hostel, Transport, Misc
    description = Column(Text, nullable=True)

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String, nullable=False)
    date_range = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False) # e.g., AI & DS, Computer Science
    board = Column(String, nullable=False)      # e.g., State Board, CBSE, ICSE
    community = Column(String, nullable=False)  # e.g., OC, OBC, BC, SC, ST
    min_percentage = Column(Float, nullable=False)
    requirements = Column(Text, nullable=True)

class ConversationMessage(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False) # e.g., user, assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AdminStat(Base):
    __tablename__ = "admin_stats"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(Integer, default=0)
