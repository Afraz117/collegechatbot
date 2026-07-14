"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  CheckCircle,
  CreditCard,
  Calendar,
  HelpCircle,
  Search,
  Settings,
  Upload,
  User,
  Trash2,
  ChevronRight,
  TrendingUp,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Info,
  Menu,
  X,
  RefreshCw,
  Plus
} from "lucide-react";

// Configuration for API URL. Points to the live Render backend.
const API_BASE_URL = "https://collegechatbot-3-o5ps.onrender.com";

// Define Interfaces
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  sources?: string[];
}

interface FeeItem {
  id: number;
  name: string;
  value: number;
  category: string;
  description?: string;
}

interface TimelineEvent {
  id: number;
  event_name: string;
  date_range: string;
  description?: string;
  order_index: number;
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface Recommendation {
  department: string;
  reason: string;
  match_percentage: number;
}

interface AdminStats {
  total_documents: number;
  questions_asked: number;
  popular_questions: FAQItem[];
  recent_uploads: string[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [sessionId, setSessionId] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recommendation states
  const [marks, setMarks] = useState<number>(85);
  const [interests, setInterests] = useState<string>("Coding, Mathematics");
  const [careerGoal, setCareerGoal] = useState<string>("Software Architect");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRecommendLoading, setIsRecommendLoading] = useState<boolean>(false);

  // Eligibility Checker states
  const [eligibilityMarks, setEligibilityMarks] = useState<number>(88);
  const [eligibilityBoard, setEligibilityBoard] = useState<string>("State Board");
  const [eligibilityCommunity, setEligibilityCommunity] = useState<string>("OBC");
  const [eligibilityDept, setEligibilityDept] = useState<string>("Computer Science");
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    reason: string;
    min_required_marks: number;
    student_marks: number;
  } | null>(null);
  const [isEligibleLoading, setIsEligibleLoading] = useState<boolean>(false);

  // Data Explorer states
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [selectedFeeCategory, setSelectedFeeCategory] = useState<string>("All");

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<{ content: string; source: string }[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);

  // Admin states
  const [adminStats, setAdminStats] = useState<AdminStats>({
    total_documents: 0,
    questions_asked: 0,
    popular_questions: [],
    recent_uploads: []
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isClearingStore, setIsClearingStore] = useState<boolean>(false);

  // Generate unique session ID on load
  useEffect(() => {
    let savedSession = localStorage.getItem("campusconnect_session_id");
    if (!savedSession) {
      savedSession = "session_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("campusconnect_session_id", savedSession);
    }
    setSessionId(savedSession);
  }, []);

  // Fetch initial database items on mount
  useEffect(() => {
    fetchFees();
    fetchTimeline();
    fetchFAQs();
    fetchAdminStats();
  }, []);

  // Fetch chat history whenever session ID is loaded
  useEffect(() => {
    if (sessionId) {
      fetchChatHistory();
    }
  }, [sessionId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Fetch Helpers
  const fetchFees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fees`);
      if (res.ok) {
        const data = await res.json();
        setFees(data);
      }
    } catch (e) {
      console.error("Error fetching fees:", e);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch (e) {
      console.error("Error fetching timeline:", e);
    }
  };

  const fetchFAQs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (e) {
      console.error("Error fetching FAQs:", e);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (e) {
      console.error("Error fetching admin stats:", e);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/conversations?session_id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Error fetching chat history:", e);
    }
  };

  // Feature 1: Chatbot submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: chatInput };
    setMessages((prev) => [...prev, userMsg]);
    const originalQuery = chatInput;
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: originalQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: data.answer,
            sources: data.sources
          }
        ]);
        fetchAdminStats(); // Refresh stats for popular counts
      } else {
        throw new Error("Chat request failed");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, I am having trouble connecting to the server. Please verify the FastAPI backend is running."
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Chat Quick Chip Click
  const handleSuggestionClick = (query: string) => {
    setChatInput(query);
  };

  // Feature 2: Course Recommendation submit
  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecommendLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks, interests, career_goal: careerGoal })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecommendLoading(false);
    }
  };

  // Feature 3: Eligibility Checker submit
  const handleEligibilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEligibleLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/eligibility/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hsc_marks: eligibilityMarks,
          board: eligibilityBoard,
          community: eligibilityCommunity,
          preferred_department: eligibilityDept
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEligibilityResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEligibleLoading(false);
    }
  };

  // Feature 7: Smart Search submit
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Feature 8: Admin Document upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus({ type: "info", message: "Uploading and processing document in vector store..." });

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadStatus({
          type: "success",
          message: `Successfully uploaded ${data.filename}! Generated ${data.chunks_indexed} document index chunks.`
        });
        setSelectedFile(null);
        fetchAdminStats();
      } else {
        const errorData = await res.json();
        setUploadStatus({ type: "error", message: errorData.detail || "Upload failed." });
      }
    } catch (e) {
      setUploadStatus({ type: "error", message: "Failed to connect to backend upload api." });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to clear vector store
  const handleClearVectorstore = async () => {
    if (!confirm("Are you sure you want to delete all vector embeddings and uploaded files? This cannot be undone.")) return;
    setIsClearingStore(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/clear-vectorstore`, { method: "POST" });
      if (res.ok) {
        alert("Knowledge base vector index and uploaded files cleared successfully.");
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearingStore(false);
    }
  };

  // Filter fees based on selected category
  const filteredFees = selectedFeeCategory === "All"
    ? fees
    : fees.filter(f => f.category.toLowerCase() === selectedFeeCategory.toLowerCase());

  // Navigation Items
  const navItems = [
    { id: "chat", name: "AI Chatbot", icon: MessageSquare },
    { id: "recommend", name: "Course Finder", icon: BookOpen },
    { id: "eligibility", name: "Eligibility Checker", icon: CheckCircle },
    { id: "fees", name: "Fee Explorer", icon: CreditCard },
    { id: "timeline", name: "Timeline", icon: Calendar },
    { id: "faq", name: "FAQs & Search", icon: HelpCircle },
    { id: "admin", name: "Admin Dashboard", icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans antialiased text-[#1F2937]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#2563EB]" />
          <span className="font-bold text-lg tracking-tight text-[#111827]">CampusConnect AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#4B5563] hover:text-[#111827] focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-[#E5E7EB] h-full p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-[#2563EB]/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-[#111827]">CampusConnect AI</span>
            <span className="text-xs text-[#6B7280]">College Admission Agent</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/15 scale-[1.02]"
                    : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[#9CA3AF]"}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[#F3F4F6] pt-6 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#4B5563] font-semibold">
            <User className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-[#111827] truncate">Demo Session</span>
            <span className="text-xs text-[#9CA3AF] truncate">{sessionId}</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-80 bg-white z-50 md:hidden p-6 flex flex-col justify-between"
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-[#2563EB]" />
                    <span className="font-bold text-lg text-[#111827]">CampusConnect AI</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                    <X className="w-6 h-6 text-[#6B7280]" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/15"
                            : "text-[#4B5563] hover:bg-[#F3F4F6]"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-[#F3F4F6] pt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#6B7280]" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold text-[#111827] truncate">Demo Session</span>
                  <span className="text-xs text-[#9CA3AF] truncate">{sessionId}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0">
        <header className="hidden md:flex h-20 items-center justify-between px-10 border-b border-[#E5E7EB] bg-white">
          <div>
            <h1 className="text-xl font-bold text-[#111827]">
              {navItems.find((n) => n.id === activeTab)?.name}
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Official University Admission Portal & AI Companion
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to IBM Granite
            </span>
          </div>
        </header>

        {/* Tab Switcher Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full max-w-6xl mx-auto"
            >
              {/* FEATURE 1: AI ADMISSION CHATBOT */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-9rem)] bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6">
                        <div className="w-16 h-16 bg-[#2563EB]/10 rounded-full flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-[#2563EB]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#111827]">Welcome to CampusConnect AI</h3>
                          <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
                            I am your dedicated college advisor. Ask me anything about admission rules, eligibility cutoffs, tuition fees, hostels, or schedules.
                          </p>
                        </div>

                        {/* Suggestions grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-4">
                          {[
                            "What is the AI & DS eligibility?",
                            "What are hostel fees?",
                            "When is admission closing?",
                            "What documents are required?"
                          ].map((query, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(query)}
                              className="text-left p-3.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-all duration-300"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl ${
                              msg.role === "user"
                                ? "bg-[#2563EB] text-white rounded-br-none"
                                : "bg-[#F3F4F6] text-[#1F2937] rounded-bl-none border border-[#E5E7EB]"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-[#E5E7EB]/25 text-[10px] font-medium flex flex-wrap items-center gap-1.5">
                                <span className="text-[#6B7280] font-semibold">Sources:</span>
                                {msg.sources.map((src, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-white/95 text-[#2563EB] px-2 py-0.5 rounded border border-[#E5E7EB]"
                                  >
                                    {src}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#F3F4F6] border border-[#E5E7EB] p-4 rounded-2xl rounded-bl-none flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 bg-[#9CA3AF] rounded-full animate-bounce" />
                          <span className="w-2.5 h-2.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2.5 h-2.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Panel */}
                  <form onSubmit={handleChatSubmit} className="p-4 border-t border-[#E5E7EB] bg-white flex items-center gap-2.5">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask your admission query..."
                      className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] px-5 py-3.5 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="bg-[#2563EB] text-white p-3.5 rounded-xl hover:bg-blue-700 hover:scale-105 disabled:bg-[#D1D5DB] disabled:scale-100 disabled:pointer-events-none transition-all duration-300 shadow-md"
                    >
                      {isChatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              )}

              {/* FEATURE 2: COURSE RECOMMENDATION */}
              {activeTab === "recommend" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Query Form */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-[#111827]">Academic Profile</h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">Define your interests and goals to get suggestions.</p>
                    </div>

                    <form onSubmit={handleRecommendSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#4B5563] flex justify-between">
                          <span>HSC Normalized Marks</span>
                          <span className="text-[#2563EB]">{marks}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={marks}
                          onChange={(e) => setMarks(Number(e.target.value))}
                          className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#4B5563]">Key Interests</label>
                        <input
                          type="text"
                          value={interests}
                          onChange={(e) => setInterests(e.target.value)}
                          placeholder="e.g., Programming, Robotics, Data structures"
                          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-4.5 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#4B5563]">Career Goal</label>
                        <input
                          type="text"
                          value={careerGoal}
                          onChange={(e) => setCareerGoal(e.target.value)}
                          placeholder="e.g., Data Scientist, Software Engineer"
                          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-4.5 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isRecommendLoading}
                        className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                      >
                        {isRecommendLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Profile...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> Suggest Departments
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Recommendations Output */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-lg text-[#111827] px-1">AI Recommendation Reports</h3>
                    
                    {recommendations.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-[#6B7280] shadow-sm flex flex-col items-center justify-center space-y-4">
                        <BookOpen className="w-12 h-12 text-[#D1D5DB]" />
                        <div>
                          <p className="font-semibold text-[#111827]">No Suggestion Generated Yet</p>
                          <p className="text-sm mt-1 max-w-sm">Submit your normalized marks, interests, and career ambitions in the form to get Granite's recommendation report.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recommendations.map((rec, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                                  {rec.match_percentage}% Match
                                </span>
                                <h4 className="font-bold text-[#111827] text-base">{rec.department}</h4>
                                <p className="text-sm text-[#4B5563] leading-relaxed">{rec.reason}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FEATURE 3: ELIGIBILITY CHECKER */}
              {activeTab === "eligibility" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Checker Form */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-[#111827]">Academic Credentials</h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">Input your board parameters to verify compliance.</p>
                    </div>

                    <form onSubmit={handleEligibilitySubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#4B5563]">HSC PCM aggregate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={eligibilityMarks}
                          onChange={(e) => setEligibilityMarks(Number(e.target.value))}
                          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#4B5563]">HSC Board</label>
                        <select
                          value={eligibilityBoard}
                          onChange={(e) => setEligibilityBoard(e.target.value)}
                          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]"
                        >
                          <option value="State Board">State Board</option>
                          <option value="CBSE">CBSE</option>
                          <option value="ICSE">ICSE</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#4B5563]">Community Category</label>
                        <select
                          value={eligibilityCommunity}
                          onChange={(e) => setEligibilityCommunity(e.target.value)}
                          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]"
                        >
                          <option value="OC">OC (Open Category)</option>
                          <option value="OBC">OBC</option>
                          <option value="BC">BC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#4B5563]">Preferred Department</label>
                        <select
                          value={eligibilityDept}
                          onChange={(e) => setEligibilityDept(e.target.value)}
                          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]"
                        >
                          <option value="Computer Science">Computer Science & Engineering</option>
                          <option value="AI & DS">Artificial Intelligence & Data Science (AI & DS)</option>
                          <option value="Information Technology">Information Technology</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isEligibleLoading}
                        className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                      >
                        {isEligibleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Eligibility"}
                      </button>
                    </form>
                  </div>

                  {/* Verification Results */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-lg text-[#111827] px-1">Eligibility Status</h3>

                    {!eligibilityResult ? (
                      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-[#6B7280] shadow-sm flex flex-col items-center justify-center space-y-4">
                        <CheckCircle className="w-12 h-12 text-[#D1D5DB]" />
                        <div>
                          <p className="font-semibold text-[#111827]">Verification Required</p>
                          <p className="text-sm mt-1 max-w-xs mx-auto">Fill and run the checker to verify compliance with institutional cutoff guidelines.</p>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-8 rounded-2xl border shadow-sm space-y-6 ${
                          eligibilityResult.eligible
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                            : "bg-rose-50/50 border-rose-200 text-rose-900"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            eligibilityResult.eligible ? "bg-emerald-100" : "bg-rose-100"
                          }`}>
                            <CheckCircle className={`w-6 h-6 ${
                              eligibilityResult.eligible ? "text-emerald-600" : "text-rose-600"
                            }`} />
                          </div>
                          <div>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                              eligibilityResult.eligible ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {eligibilityResult.eligible ? "Eligible" : "Not Eligible"}
                            </span>
                            <h4 className="font-bold text-base text-[#111827] mt-1">Verification Report</h4>
                          </div>
                        </div>

                        <p className="text-sm leading-relaxed font-medium">{eligibilityResult.reason}</p>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                          <div className="bg-white/70 p-4 rounded-xl border border-black/5">
                            <span className="text-xs text-[#6B7280] font-semibold">Institutional Cutoff</span>
                            <p className="text-xl font-bold text-[#111827] mt-0.5">{eligibilityResult.min_required_marks}%</p>
                          </div>
                          <div className="bg-white/70 p-4 rounded-xl border border-black/5">
                            <span className="text-xs text-[#6B7280] font-semibold">Your Normalized Score</span>
                            <p className="text-xl font-bold text-[#111827] mt-0.5">{eligibilityResult.student_marks}%</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* FEATURE 4: FEE EXPLORER */}
              {activeTab === "fees" && (
                <div className="space-y-6">
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-2.5">
                    {["All", "Tuition", "Hostel", "Transport", "Misc"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedFeeCategory(cat)}
                        className={`px-4.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          selectedFeeCategory === cat
                            ? "bg-[#2563EB] text-white shadow-md"
                            : "bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-gray-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Fees Grid/Table */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#4B5563]">Item Detail</th>
                            <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#4B5563]">Category</th>
                            <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#4B5563]">Description</th>
                            <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#4B5563] text-right">Annual Value (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {filteredFees.map((fee) => (
                            <tr key={fee.id} className="hover:bg-[#F9FAFB] transition-colors">
                              <td className="px-6 py-4.5 font-semibold text-sm text-[#111827]">{fee.name}</td>
                              <td className="px-6 py-4.5">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB]">
                                  {fee.category}
                                </span>
                              </td>
                              <td className="px-6 py-4.5 text-sm text-[#6B7280]">{fee.description || "General Fee Detail"}</td>
                              <td className="px-6 py-4.5 text-right font-bold text-sm text-[#111827]">
                                {fee.value.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {filteredFees.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-10 text-sm text-[#6B7280]">
                                No fees records available in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 5: ADMISSION TIMELINE */}
              {activeTab === "timeline" && (
                <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm max-w-3xl mx-auto">
                  <div className="text-center mb-10">
                    <h3 className="font-bold text-xl text-[#111827]">Admission Milestone Road</h3>
                    <p className="text-sm text-[#6B7280] mt-1">Interactive roadmap detailing stages from entry to classes.</p>
                  </div>

                  <div className="relative border-l-2 border-[#2563EB]/20 ml-4.5 space-y-10 py-2">
                    {timeline.map((event, index) => (
                      <div key={event.id} className="relative pl-8 group">
                        {/* Dot indicator */}
                        <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">{event.date_range}</span>
                            <span className="text-xs text-[#9CA3AF]">Step {index + 1}</span>
                          </div>
                          <h4 className="font-bold text-base text-[#111827]">{event.event_name}</h4>
                          <p className="text-sm text-[#4B5563] leading-relaxed max-w-xl">{event.description}</p>
                        </div>
                      </div>
                    ))}
                    {timeline.length === 0 && (
                      <div className="text-center py-10 text-sm text-[#6B7280]">
                        No timeline milestones configured in database.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FEATURE 6 & 7: FAQ & SMART SEARCH */}
              {activeTab === "faq" && (
                <div className="space-y-10">
                  {/* Smart Search brochure */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-[#111827] flex items-center gap-2">
                        <Search className="w-5 h-5 text-[#2563EB]" /> Smart Admission Search
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">Direct semantic search on indexed admission prospectus documents.</p>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search key words: hostel rules, fees, scholarship eligibility..."
                        className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] px-4.5 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]"
                      />
                      <button
                        type="submit"
                        disabled={isSearchLoading || !searchQuery.trim()}
                        className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-300 shadow-sm flex items-center gap-1.5"
                      >
                        {isSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                      </button>
                    </form>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="pt-4 border-t border-[#F3F4F6] space-y-3.5">
                        <h4 className="text-xs font-bold text-[#4B5563]">Matching Prospectus Snippets</h4>
                        {searchResults.map((result, idx) => (
                          <div key={idx} className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-1.5">
                            <p className="text-xs text-[#4B5563] leading-relaxed">{result.content}</p>
                            <span className="inline-block text-[10px] font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded">
                              Source: {result.source}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FAQ Accordion list */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-[#111827] px-1">Common Admission FAQs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {faqs.map((faq) => (
                        <div key={faq.id} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {faq.category}
                          </span>
                          <h4 className="font-bold text-sm text-[#111827] pt-1">{faq.question}</h4>
                          <p className="text-xs text-[#4B5563] leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                      {faqs.length === 0 && (
                        <div className="col-span-2 text-center py-10 text-sm text-[#6B7280]">
                          No FAQs available in database.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 9 & 10: ADMIN DASHBOARD */}
              {activeTab === "admin" && (
                <div className="space-y-8">
                  {/* Dashboard Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-[#2563EB]/10 rounded-xl">
                        <FileText className="w-6 h-6 text-[#2563EB]" />
                      </div>
                      <div>
                        <span className="text-xs text-[#6B7280] font-semibold">Total Documents</span>
                        <h4 className="text-2xl font-bold text-[#111827] mt-0.5">{adminStats.total_documents}</h4>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-[#2563EB]/10 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-[#2563EB]" />
                      </div>
                      <div>
                        <span className="text-xs text-[#6B7280] font-semibold">Questions Processed</span>
                        <h4 className="text-2xl font-bold text-[#111827] mt-0.5">{adminStats.questions_asked}</h4>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-[#2563EB]/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-[#2563EB]" />
                      </div>
                      <div>
                        <span className="text-xs text-[#6B7280] font-semibold">Active LLM API</span>
                        <h4 className="text-sm font-bold text-[#111827] mt-1.5 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          IBM Granite 3
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Document Uploader */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-5">
                      <div>
                        <h3 className="font-bold text-base text-[#111827]">Upload Admission Documents</h3>
                        <p className="text-xs text-[#6B7280] mt-0.5">Add Brochure, Prospectus, or Fees guidelines. RAG vector store updates automatically.</p>
                      </div>

                      <form onSubmit={handleFileUpload} className="space-y-4">
                        <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center bg-[#F9FAFB] hover:bg-gray-50 transition-colors relative">
                          <input
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf,.docx,.txt"
                          />
                          <Upload className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2.5" />
                          {selectedFile ? (
                            <span className="text-xs font-semibold text-[#111827]">{selectedFile.name}</span>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-[#4B5563]">Click to choose file or drag & drop</p>
                              <p className="text-[10px] text-[#9CA3AF]">Supports PDF, DOCX, TXT up to 10MB</p>
                            </div>
                          )}
                        </div>

                        {uploadStatus && (
                          <div className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                            uploadStatus.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" :
                            uploadStatus.type === "error" ? "bg-rose-50 border border-rose-200 text-rose-800" :
                            "bg-blue-50 border border-blue-100 text-blue-800"
                          }`}>
                            {uploadStatus.message}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={!selectedFile || isUploading}
                          className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:bg-[#D1D5DB] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5"
                        >
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Ingest into RAG
                        </button>
                      </form>
                    </div>

                    {/* Vector Store Management / Recent list */}
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between space-y-6">
                      <div>
                        <h3 className="font-bold text-base text-[#111827]">Knowledge Base Documents</h3>
                        <p className="text-xs text-[#6B7280] mt-0.5">Recently uploaded files active in context retrieval.</p>
                        
                        <div className="mt-4.5 space-y-2.5">
                          {adminStats.recent_uploads && adminStats.recent_uploads.map((filename, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
                              <FileText className="w-4 h-4 text-[#9CA3AF]" />
                              <span className="text-xs font-semibold text-[#111827] truncate flex-1">{filename}</span>
                            </div>
                          ))}
                          {(!adminStats.recent_uploads || adminStats.recent_uploads.length === 0) && (
                            <p className="text-xs text-[#9CA3AF] py-4 text-center">No documents in current vector store index.</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#F3F4F6] flex gap-3.5">
                        <button
                          onClick={handleClearVectorstore}
                          disabled={isClearingStore}
                          className="flex-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-1.5"
                        >
                          {isClearingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Reset Vector Store
                        </button>
                        <button
                          onClick={fetchAdminStats}
                          className="px-4.5 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-xl flex items-center justify-center"
                        >
                          <RefreshCw className="w-4 h-4 text-[#4B5563]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
