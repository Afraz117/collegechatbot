import os
import sys
# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.llm_service import LLMService

def main():
    print("=== Testing IBM Granite LLM Service Integration ===")
    
    # Initialize service
    llm_service = LLMService()
    
    # 1. Test Chatbot Answer
    context_chunks = [
        "Tuition Fee for B.Tech AI & DS is 80,000 INR per year. Sports quota gets a 50% discount.",
        "Admission closes on August 15th, 2026."
    ]
    
    print("\n--- Test Chatbot Answer 1 (Known context) ---")
    q1 = "What is the tuition fee for AI & DS?"
    ans1 = llm_service.answer_question(q1, context_chunks)
    print(f"Q: {q1}\nA: {ans1}")
    
    print("\n--- Test Chatbot Answer 2 (Unknown context) ---")
    q2 = "What are the rules for management quota seats?"
    ans2 = llm_service.answer_question(q2, context_chunks)
    print(f"Q: {q2}\nA: {ans2}")

    # 2. Test Recommendation
    print("\n--- Test Course Recommendations ---")
    recs_json = llm_service.get_course_recommendations(
        marks=92.5,
        interests="Coding, Algorithms, Machine Learning",
        career_goal="Data Scientist at a tech firm"
    )
    print(f"Response:\n{recs_json}")

if __name__ == "__main__":
    main()
