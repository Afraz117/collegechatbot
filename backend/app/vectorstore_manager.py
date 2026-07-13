import os
from typing import List, Optional
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from .database import settings

class VectorStoreManager:
    def __init__(self):
        print(f"Initializing local embeddings model: {settings.EMBEDDING_MODEL_NAME}...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL_NAME,
            model_kwargs={'device': 'cpu'}
        )
        self.vectorstore_path = settings.VECTORSTORE_PATH
        self.index_name = "index"

    def load_vectorstore(self) -> Optional[FAISS]:
        index_file = os.path.join(self.vectorstore_path, f"{self.index_name}.faiss")
        if not os.path.exists(index_file):
            print(f"No FAISS index found at {index_file}. A new one will be created upon file ingestion.")
            return None
        try:
            # Allow dangerous deserialization because it's locally generated index
            return FAISS.load_local(
                folder_path=self.vectorstore_path,
                embeddings=self.embeddings,
                index_name=self.index_name,
                allow_dangerous_deserialization=True
            )
        except Exception as e:
            print(f"Error loading FAISS index: {e}")
            return None

    def add_documents(self, documents: List[Document]) -> bool:
        if not documents:
            return False
            
        # Ensure directories exist
        os.makedirs(self.vectorstore_path, exist_ok=True)
        
        try:
            vectorstore = self.load_vectorstore()
            if vectorstore is None:
                # Create a new FAISS index from the first batch of documents
                print("Creating new FAISS vector store...")
                vectorstore = FAISS.from_documents(documents, self.embeddings)
            else:
                # Add to existing index
                print(f"Adding {len(documents)} chunks to existing FAISS vector store...")
                vectorstore.add_documents(documents)
            
            # Save the updated index
            vectorstore.save_local(
                folder_path=self.vectorstore_path,
                index_name=self.index_name
            )
            print("FAISS vector store saved successfully!")
            return True
        except Exception as e:
            print(f"Error adding documents to FAISS index: {e}")
            return False

    def search_similarity(self, query: str, k: int = 4) -> List[Document]:
        vectorstore = self.load_vectorstore()
        if vectorstore is None:
            print("Search warning: Vector store is empty/not initialized.")
            return []
            
        try:
            # Perform similarity search
            results = vectorstore.similarity_search(query, k=k)
            return results
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []
            
    def delete_vectorstore(self) -> bool:
        """Deletes all local index files to clear the database."""
        try:
            index_file = os.path.join(self.vectorstore_path, f"{self.index_name}.faiss")
            pkl_file = os.path.join(self.vectorstore_path, f"{self.index_name}.pkl")
            if os.path.exists(index_file):
                os.remove(index_file)
            if os.path.exists(pkl_file):
                os.remove(pkl_file)
            print("FAISS index deleted successfully.")
            return True
        except Exception as e:
            print(f"Error deleting vector store index: {e}")
            return False
