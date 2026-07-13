import sys
import os
# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import FAQ, Fee, TimelineEvent, EligibilityRule, AdminStat

def init_database():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(FAQ).count() > 0:
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding database with default college admission data...")
        
        # 1. Seed FAQs
        faqs = [
            FAQ(
                question="What is the admission eligibility for B.Tech AI & DS?",
                answer="To be eligible for B.Tech AI & DS (Artificial Intelligence & Data Science), students must have passed HSC (10+2) with Physics, Chemistry, and Mathematics. The minimum score required is 90% for Open Category (OC), 85% for OBC, and 75% for SC/ST categories.",
                category="Eligibility"
            ),
            FAQ(
                question="What are the hostel fees and facilities?",
                answer="The annual hostel fee is 60,000 INR. This includes boarding, lodging, 24/7 high-speed Wi-Fi, laundry service, study rooms, gym access, and a choice of vegetarian/non-vegetarian dining.",
                category="Hostel"
            ),
            FAQ(
                question="What documents are required at the time of counselling/admission?",
                answer="Candidates must bring: 1) Class 10 Marksheet, 2) Class 12 (HSC) Marksheet, 3) Transfer Certificate (TC), 4) Community/Caste Certificate (if applicable), 5) Migration Certificate (for CBSE/ICSE boards), 6) Aadhaar Card copy, and 7) 6 passport-sized photographs.",
                category="General"
            ),
            FAQ(
                question="What is the tuition fee for B.E. Computer Science?",
                answer="The tuition fee for B.E. Computer Science and Engineering is 75,000 INR per annum under the government quota, and 1,20,000 INR per annum for management quota seats.",
                category="Fees"
            ),
            FAQ(
                question="When is the last date to apply for college admission?",
                answer="Online applications open on June 1st and close on June 30th. Late submissions are not accepted. The rank list will be published on July 10th.",
                category="Timeline"
            )
        ]
        db.add_all(faqs)

        # 2. Seed Fees
        fees = [
            Fee(name="Tuition Fee - Computer Science & Engineering", value=75000.0, category="Tuition", description="Annual tuition fee for CSE department"),
            Fee(name="Tuition Fee - Artificial Intelligence & Data Science", value=80000.0, category="Tuition", description="Annual tuition fee for AI & DS department"),
            Fee(name="Tuition Fee - Information Technology", value=75000.0, category="Tuition", description="Annual tuition fee for IT department"),
            Fee(name="Hostel Rent & Mess Charge", value=60000.0, category="Hostel", description="Annual boarding, food, and accommodation fee"),
            Fee(name="Transport Fee (Annual Bus Pass)", value=25000.0, category="Transport", description="Optional college bus transport covering all city routes"),
            Fee(name="Library & Lab Infrastructure Fee", value=15000.0, category="Misc", description="One-time lab and library development fee paid during admission"),
            Fee(name="Admission & Registration Processing Fee", value=5000.0, category="Misc", description="One-time non-refundable application registration fee")
        ]
        db.add_all(fees)

        # 3. Seed Timeline
        events = [
            TimelineEvent(event_name="Application Portal Opens", date_range="June 01, 2026", description="Online applications open on the official portal for all departments.", order_index=1),
            TimelineEvent(event_name="Last Date to Apply", date_range="June 30, 2026", description="Deadline for application submission and document upload.", order_index=2),
            TimelineEvent(event_name="Cutoff / Merit Rank List Publication", date_range="July 10, 2026", description="Rank lists published based on HSC normalized cutoff scores.", order_index=3),
            TimelineEvent(event_name="Online Counselling Sessions", date_range="July 15 - July 20, 2026", description="Branch selection according to candidate rank lists.", order_index=4),
            TimelineEvent(event_name="Seat Allotment Confirmation", date_range="July 25, 2026", description="Allotment letters issued for chosen colleges & departments.", order_index=5),
            TimelineEvent(event_name="Document Verification & Initial Fee Payment", date_range="July 26 - August 05, 2026", description="Physical certificate verification at campus and tuition fee deposit to seal seat.", order_index=6)
        ]
        db.add_all(events)

        # 4. Seed Eligibility Rules
        rules = [
            # Computer Science
            EligibilityRule(department="Computer Science", board="State Board", community="OC", min_percentage=85.0, requirements="Pass 12th with PCM. Minimum 85% aggregate in Math, Physics & Chemistry."),
            EligibilityRule(department="Computer Science", board="State Board", community="OBC", min_percentage=80.0, requirements="Pass 12th with PCM. Minimum 80% aggregate in Math, Physics & Chemistry."),
            EligibilityRule(department="Computer Science", board="State Board", community="SC", min_percentage=70.0, requirements="Pass 12th with PCM. Minimum 70% aggregate in Math, Physics & Chemistry."),
            EligibilityRule(department="Computer Science", board="State Board", community="ST", min_percentage=70.0, requirements="Pass 12th with PCM. Minimum 70% aggregate in Math, Physics & Chemistry."),
            
            EligibilityRule(department="Computer Science", board="CBSE", community="OC", min_percentage=80.0, requirements="Pass 12th from CBSE with PCM. Minimum 80% in core subjects."),
            EligibilityRule(department="Computer Science", board="CBSE", community="OBC", min_percentage=75.0, requirements="Pass 12th from CBSE with PCM. Minimum 75% in core subjects."),
            EligibilityRule(department="Computer Science", board="CBSE", community="SC", min_percentage=65.0, requirements="Pass 12th from CBSE with PCM. Minimum 65% in core subjects."),

            # AI & DS
            EligibilityRule(department="AI & DS", board="State Board", community="OC", min_percentage=90.0, requirements="Pass 12th with PCM. High math capability. Minimum 90% aggregate in PCM."),
            EligibilityRule(department="AI & DS", board="State Board", community="OBC", min_percentage=85.0, requirements="Pass 12th with PCM. Minimum 85% aggregate in PCM."),
            EligibilityRule(department="AI & DS", board="State Board", community="SC", min_percentage=75.0, requirements="Pass 12th with PCM. Minimum 75% aggregate in PCM."),
            
            EligibilityRule(department="AI & DS", board="CBSE", community="OC", min_percentage=85.0, requirements="Pass 12th from CBSE with PCM. Minimum 85% in core subjects."),
            EligibilityRule(department="AI & DS", board="CBSE", community="OBC", min_percentage=80.0, requirements="Pass 12th from CBSE with PCM. Minimum 80% in core subjects."),
            EligibilityRule(department="AI & DS", board="CBSE", community="SC", min_percentage=70.0, requirements="Pass 12th from CBSE with PCM. Minimum 70% in core subjects.")
        ]
        db.add_all(rules)

        # 5. Initialize Admin Stats
        stats = [
            AdminStat(key="questions_asked", value=0),
            AdminStat(key="total_documents", value=0)
        ]
        db.add_all(stats)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
