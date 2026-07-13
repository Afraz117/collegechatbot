import os
from typing import List, Tuple
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_ibm import WatsonxLLM
from .database import settings

class LLMService:
    def __init__(self):
        self.api_key = settings.WATSONX_API_KEY
        self.project_id = settings.WATSONX_PROJECT_ID
        self.url = settings.WATSONX_URL
        self.model_id = settings.WATSONX_MODEL_ID
        self.is_mock = False

        if not self.api_key or not self.project_id or self.api_key.strip() == "" or self.project_id.strip() == "":
            print("\n" + "="*80)
            print("WARNING: IBM watsonx API key or Project ID is missing from .env file!")
            print("CampusConnect AI will operate in MOCK LLM FALLBACK MODE.")
            print("It will return simulated responses based on retrieved document contexts.")
            print("="*80 + "\n")
            self.is_mock = True
            self.llm = None
        else:
            try:
                print(f"Initializing IBM watsonx model: {self.model_id}...")
                self.llm = WatsonxLLM(
                    model_id=self.model_id,
                    url=self.url,
                    project_id=self.project_id,
                    params={
                        "decoding_method": "greedy",
                        "max_new_tokens": 512,
                        "min_new_tokens": 1,
                        "temperature": 0.0, # 0.0 temperature to minimize hallucinations
                    }
                )
            except Exception as e:
                print(f"Failed to initialize WatsonxLLM: {e}. Falling back to Mock LLM.")
                self.is_mock = True
                self.llm = None

        # Build QA prompt
        self.qa_prompt_template = """You are CampusConnect AI, the official intelligent admission assistant for our college.
Your task is to answer the student's question based strictly and only on the provided context retrieved from our official documents.

Rules:
1. Rely only on the clear facts mentioned in the context.
2. If the context does not contain the answer, politely respond with exactly: "I am sorry, but I could not find that information in the uploaded college documents. Please contact the admissions office directly for further assistance."
3. Do not assume, extrapolate, or hallucinate any facts.
4. Keep the tone helpful, professional, and friendly.

Context:
{context}

Question:
{question}

Answer:"""
        
        self.qa_prompt = PromptTemplate(
            template=self.qa_prompt_template,
            input_variables=["context", "question"]
        )

        # Build recommendation prompt
        self.recommend_prompt_template = """You are CampusConnect AI, an intelligent academic counselor.
Based on the student's academic profile, interests, and career goal, recommend the most suitable branches from our departments:
- Computer Science & Engineering (CSE)
- Information Technology (IT)
- Artificial Intelligence & Data Science (AI & DS)

Input Profile:
- Marks Indicator: {marks}/100
- Interests: {interests}
- Career Goal: {career_goal}

Provide structured output list. Each recommendation must contain:
1. Department name
2. Reason for recommendation
3. Match percentage (estimate as integer between 50 and 100 based on profile fit)

Return your output strictly as a JSON string with the following structure:
{{
  "recommendations": [
    {{
      "department": "Department Name",
      "reason": "Clear explanation of why this fits their interests and career goal.",
      "match_percentage": 90
    }}
  ]
}}

JSON Output:"""
        
        self.recommend_prompt = PromptTemplate(
            template=self.recommend_prompt_template,
            input_variables=["marks", "interests", "career_goal"]
        )

    def answer_question(self, question: str, context_chunks: List[str]) -> str:
        context_str = "\n---\n".join(context_chunks) if context_chunks else "No documents uploaded or retrieved."
        
        if self.is_mock:
            return self._mock_rag_answer(question, context_str)
            
        try:
            chain = self.qa_prompt | self.llm | StrOutputParser()
            response = chain.invoke({"context": context_str, "question": question})
            return response.strip()
        except Exception as e:
            print(f"Error invoking IBM watsonx model: {e}")
            return f"Error connecting to AI service. Fallback mock answer: \n{self._mock_rag_answer(question, context_str)}"

    def get_course_recommendations(self, marks: float, interests: str, career_goal: str) -> str:
        if self.is_mock:
            return self._mock_course_recommendations(marks, interests, career_goal)
            
        try:
            chain = self.recommend_prompt | self.llm | StrOutputParser()
            response = chain.invoke({
                "marks": str(marks),
                "interests": interests,
                "career_goal": career_goal
            })
            return response.strip()
        except Exception as e:
            print(f"Error invoking IBM watsonx recommendation model: {e}")
            return self._mock_course_recommendations(marks, interests, career_goal)

    def _mock_rag_answer(self, question: str, context: str) -> str:
        """Simulates RAG answers by searching context for match keywords if watsonx is offline."""
        question_lower = question.lower()
        
        # Check if we have context
        if not context or "No documents" in context or len(context.strip()) < 10:
            return "I am sorry, but I could not find that information in the uploaded college documents. Please contact the admissions office directly for further assistance."
            
        # Simple extraction search helper
        context_lines = context.split("\n")
        matching_lines = []
        for line in context_lines:
            # check overlaps
            words = [w for w in question_lower.split() if len(w) > 3]
            matches = sum(1 for w in words if w in line.lower())
            if matches >= 2:
                matching_lines.append(line.strip())
                
        if matching_lines:
            joined_context = " ".join(matching_lines)
            return f"[Mock AI] Based on retrieved facts: {joined_context}"
            
        # Hardcoded mock responses for common seeded queries in case similarity search matches seeded database
        if "hostel" in question_lower:
            return "[Mock AI] The annual hostel fee is 60,000 INR. This includes boarding, lodging, Wi-Fi, laundry service, study rooms, and gym access."
        elif "ai & ds" in question_lower or "eligibility" in question_lower:
            return "[Mock AI] To be eligible for B.Tech AI & DS, students must have passed HSC (10+2) with Physics, Chemistry, and Mathematics. The minimum score required is 90% for Open Category (OC), 85% for OBC, and 75% for SC/ST."
        elif "document" in question_lower or "counselling" in question_lower:
            return "[Mock AI] The required documents are: Class 10 and 12 marksheets, Transfer Certificate (TC), Community Certificate, Migration Certificate (for CBSE/ICSE), Aadhaar Card, and passport photographs."
        elif "tuition" in question_lower or "fee" in question_lower or "computer science" in question_lower:
            return "[Mock AI] The tuition fee for B.E. Computer Science and Engineering is 75,000 INR per annum under the government quota, and 1,20,000 INR per annum for management quota."
            
        return "I am sorry, but I could not find that information in the uploaded college documents. Please contact the admissions office directly for further assistance."

    def _mock_course_recommendations(self, marks: float, interests: str, career_goal: str) -> str:
        """Simulates recommendations in JSON structure if watsonx is offline."""
        interests_lower = interests.lower()
        goal_lower = career_goal.lower()
        
        recs = []
        
        # CSE Match
        if "program" in interests_lower or "soft" in goal_lower or "code" in interests_lower or "engineer" in goal_lower:
            recs.append({
                "department": "Computer Science & Engineering (CSE)",
                "reason": f"Since your career goal is to become a '{career_goal}' and you are interested in '{interests}', our CSE department provides solid training in software construction, algorithms, and computing systems.",
                "match_percentage": int(85 + (marks * 0.15))
            })
            
        # AI & DS Match
        if "data" in interests_lower or "science" in goal_lower or "ai" in interests_lower or "intell" in interests_lower:
            recs.append({
                "department": "Artificial Intelligence & Data Science (AI & DS)",
                "reason": f"Your interest in '{interests}' maps perfectly to machine learning and analytics. AI & DS will support your career goal of '{career_goal}' by preparing you for data-driven developer tracks.",
                "match_percentage": int(80 + (marks * 0.2))
            })
            
        # IT Match
        if "network" in interests_lower or "web" in interests_lower or "admin" in goal_lower or len(recs) == 0:
            recs.append({
                "department": "Information Technology (IT)",
                "reason": f"Information Technology focuses heavily on cloud architectures, web development, and network security, aligning well with your interest in '{interests}'.",
                "match_percentage": int(75 + (marks * 0.18))
            })
            
        # Format JSON response
        import json
        return json.dumps({"recommendations": recs[:2]})
