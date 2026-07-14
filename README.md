# 🎓 CampusConnect AI - Intelligent College Admission Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/license-MIT-green)

**CampusConnect AI** is a state-of-the-art full-stack web application designed to streamline the college admission process. It leverages **Retrieval-Augmented Generation (RAG)** powered by **IBM Watsonx (Granite-3-8b-instruct)** to provide instant, highly accurate answers from official college documents. 

## ✨ Key Features

* **🤖 Intelligent RAG Chatbot**: Chat seamlessly with an AI that retrieves factual answers directly from the institution's uploaded prospectuses and academic regulations.
* **🎯 Smart Course Recommender**: Input your marks, interests, and career goals to get personalized department recommendations.
* **✅ Instant Eligibility Checker**: Select your board, category, and department to verify if you meet the minimum admission cutoffs.
* **📊 Interactive Data Explorer**: Easily browse tabular data regarding Fees, Admission Timelines, and Frequently Asked Questions (FAQs).
* **⚙️ Admin Dashboard**: Secure panel to upload new PDF/TXT documents. The backend automatically chunks the text, generates embeddings, and indexes them into the local vector database in real-time.

## 🛠️ Technology Stack

**Frontend (Client)**
* [Next.js](https://nextjs.org/) (React Framework, Static Export)
* Tailwind CSS (Styling & Responsive Design)
* Framer Motion (Micro-animations and transitions)
* Lucide React (Icons)

**Backend (Server & AI)**
* [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python web framework)
* [LangChain](https://python.langchain.com/) (LLM orchestration & document processing)
* **FAISS** (Facebook AI Similarity Search for the local vector database)
* **HuggingFace** (`all-MiniLM-L6-v2` for generating embeddings)
* **IBM Watsonx** (`ibm/granite-3-8b-instruct` for final RAG synthesis)

## 🚀 Local Development Setup

To run both the backend and frontend simultaneously on Windows:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Afraz117/collegechatbot.git
   cd collegechatbot
   ```

2. **Configure Environment Variables**
   * Navigate to `backend/` and rename `.env.template` to `.env`.
   * Fill in your IBM Watsonx API keys (`WATSONX_API_KEY` and `WATSONX_PROJECT_ID`).

3. **Install Dependencies**
   * **Backend**: 
     ```bash
     cd backend
     python -m venv venv
     .\venv\Scripts\activate
     pip install -r requirements.txt
     ```
   * **Frontend**:
     ```bash
     cd frontend
     npm install
     ```

4. **Launch the Application**
   Run the included PowerShell script in the root directory:
   ```powershell
   .\run.ps1
   ```
   * This automatically opens two terminal windows and starts both servers.
   * Frontend Web UI: `http://localhost:3000`
   * Backend API Docs: `http://localhost:8000/docs`

## ☁️ Deployment

This project is configured for seamless deployment on **Render.com**.
* The **Backend** is deployed as a Web Service running Uvicorn.
* The **Frontend** is exported statically (`next build`) and deployed as a ultra-fast Static Site.
* See `render.yaml` for the infrastructure-as-code Blueprint configurations.

---
*Built with modern full-stack web and AI technologies to simplify education.*
