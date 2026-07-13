import os
import sys
# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.document_parser import DocumentParser
from app.vectorstore_manager import VectorStoreManager

def main():
    print("=== Testing RAG Document Processing Pipeline ===")
    
    # 1. Create a dummy test file
    test_dir = "../knowledge_base"
    os.makedirs(test_dir, exist_ok=True)
    test_file_path = os.path.join(test_dir, "admission_test_guide.txt")
    
    test_content = """
    CampusConnect University Admission Guide 2026.
    Welcome to CampusConnect University.
    
    1. Scholarship Details:
    We offer merit-based scholarships up to 50% waiver in tuition fees for students securing above 95% in HSC board exams.
    Sports quota scholarships offer 100% tuition fee waiver for national level athletes.
    
    2. Hostel Accommodation:
    Hostel rooms are available on sharing basis (2-seater and 3-seater). 
    AC rooms are available on request and cost an extra 15,000 INR per year.
    Hot water, laundry, and Wi-Fi are fully integrated.
    
    3. Course Details - B.Tech Artificial Intelligence & Data Science (AI & DS):
    This course focuses on machine learning, deep learning, data visualization, and python programming. 
    It is a 4-year undergraduate degree program.
    """
    
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write(test_content)
    print(f"Created sample text file at: {test_file_path}")

    # 2. Parse the document
    parser = DocumentParser(chunk_size=150, chunk_overlap=20)
    print("Parsing file and generating chunks...")
    chunks = parser.parse_file(test_file_path)
    print(f"Successfully generated {len(chunks)} text chunks.")
    for idx, chunk in enumerate(chunks):
        print(f"Chunk {idx+1} Content Preview: {repr(chunk.page_content)}")

    # 3. Add to FAISS Vector Store
    v_manager = VectorStoreManager()
    print("Cleaning any existing vector store...")
    v_manager.delete_vectorstore()
    
    print("Ingesting chunks into FAISS...")
    success = v_manager.add_documents(chunks)
    if success:
        print("Successfully ingested documents into FAISS vector store!")
    else:
        print("Failed to ingest documents.")
        return

    # 4. Perform Similarity Search Test
    query = "What is the cost of AC rooms in hostel?"
    print(f"\nQuerying vector store for: '{query}'...")
    results = v_manager.search_similarity(query, k=2)
    
    print("\n--- Search Results ---")
    for idx, doc in enumerate(results):
        print(f"Result {idx+1} (Source: {doc.metadata['source']}):")
        print(f"Content: {doc.page_content}")
        print("-" * 30)

    # Clean up test file
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
        print("\nCleaned up sample test file.")

if __name__ == "__main__":
    main()
