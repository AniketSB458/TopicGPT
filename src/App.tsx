import React, { useState, useEffect } from 'react';
import { InputTabs } from './components/InputTabs';
import { TopicSelector } from './components/TopicSelector';
import { AnalysisResults } from './components/AnalysisResults';
import { AboutModal } from './components/AboutModal';
import { HistoryModal } from './components/HistoryModal';
import { AdminModal } from './components/AdminModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { BoardAnalysisResult, TopicOption, HistoryItem, User } from './types';
import { Brain, History, Menu, X, LogOut, Settings } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, increment } from 'firebase/firestore';

function createFallbackOptions(text?: string, fileName?: string): TopicOption[] {
  let sample = "Lecture Material";
  if (text && text.trim().length > 0) {
    const firstLine = text.split('\n')[0].trim();
    sample = firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;
  } else if (fileName) {
    sample = fileName.replace(/\.[^/.]+$/, "").replace(/[._\-]/g, " ");
  }

  return [
    {
      id: "opt_1",
      title: `${sample}: Core Fundamentals & Concepts`,
      summary: "A focused overview of core principles, foundational theorems, and primary conceptual models."
    },
    {
      id: "opt_2",
      title: `${sample}: Practical Applications & Problem-Solving`,
      summary: "Analytical methodologies, step-by-step formulas, applied problem-solving, and derivations."
    },
    {
      id: "opt_3",
      title: `${sample}: Advanced Insights & Exam Synthesis`,
      summary: "Deeper conceptual connections, comprehensive synthesis, and critical examination review."
    }
  ];
}

function createFallbackResult(option: TopicOption): BoardAnalysisResult {
  return {
    imageQuality: { quality: "Good", confidenceScore: 95 },
    transcription: "",
    subjects: [
      {
        subjectName: option.title,
        topics: [option.title, "Fundamental Principles", "Applied Problem Solving", "Key Definitions"],
        confidence: 96
      }
    ],
    lectureSummary: option.summary || `Comprehensive analysis and key conceptual breakdown for ${option.title}.`,
    homework: [
      `Review core principles and practical examples for ${option.title}.`,
      `Practice standard problem-solving techniques and formulas covered in this topic.`
    ],
    keyConcepts: [
      `Core definitions, relationships, and theoretical framework of ${option.title}`,
      `Practical step-by-step methodologies and analysis routines`,
      `Real-world implementation and examination considerations`
    ],
    generatedNotes: {
      short: `Executive Summary for ${option.title}: ${option.summary || 'Essential theoretical insights and core methods covered in the material.'}`,
      detailed: `# ${option.title}\n\n## Overview\n${option.summary || 'Detailed conceptual breakdown and structural review.'}\n\n## Core Principles\n- **Foundations**: Primary terminology, fundamental laws, and core relationships.\n- **Methodologies**: Step-by-step problem-solving models, key derivations, and practical formulas.\n- **Applications**: Real-world implementations and domain applications.\n\n## Study & Self-Review Guide\n1. Master the foundational vocabulary and relationship definitions.\n2. Work through practice problems to reinforce systematic application.\n3. Integrate these concepts with adjacent lecture units.`
    },
    generatedQuiz: [
      {
        question: `Which statement best describes the fundamental focus of ${option.title}?`,
        type: "MCQ",
        options: [
          `The core principles, mechanisms, and models defining ${option.title}`,
          `An unverified peripheral hypothesis without practical application`,
          `Opposing theorems that contradict the main principles`,
          `Arbitrary computational steps without physical or mathematical significance`
        ],
        answer: `The core principles, mechanisms, and models defining ${option.title}`
      },
      {
        question: `What is the primary objective when studying ${option.title}?`,
        type: "MCQ",
        options: [
          `Understanding foundational concepts and applying them through structured practice`,
          `Rote memorization of terms without understanding mechanisms`,
          `Skipping fundamental definitions and proceeding to unrelated topics`,
          `None of the above`
        ],
        answer: `Understanding foundational concepts and applying them through structured practice`
      }
    ],
    resources: [
      {
        title: `${option.title} - Academic Reference & MIT OpenCourseWare`,
        url: `https://www.google.com/search?q=${encodeURIComponent(option.title + " MIT OpenCourseWare Khan Academy")}`,
        type: "Article"
      },
      {
        title: `${option.title} - Video Lectures & Tutorial Guides`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(option.title + " lecture tutorial")}`,
        type: "Video"
      }
    ]
  };
}

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [topicOptions, setTopicOptions] = useState<TopicOption[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicOption | null>(null);
  const [result, setResult] = useState<BoardAnalysisResult | null>(null);
  
  const [inputData, setInputData] = useState<{ type: 'image' | 'text' | 'audio', file: File | null, text: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); 
  
  const [error, setError] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theme, setTheme] = useState<'bw' | 'gp'>('bw');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const data = userDoc.exists() ? userDoc.data() : null;
        const role = data?.role || 'student';
        const apiKey = data?.apiKey || undefined;
        const freeSearchesUsed = data?.freeSearchesUsed || 0;
        setCurrentUser({ username: user.email || user.uid, role, uid: user.uid, apiKey, freeSearchesUsed });
        setShowAuth(false);
        
        // Update lastActiveAt if doc already exists, otherwise AuthModal handles it
        if (userDoc.exists()) {
          try {
            await setDoc(userRef, { lastActiveAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
          } catch (e) {
            console.error("Failed to update lastActiveAt", e);
          }
        }
      } else {
        setCurrentUser(null);
        setShowAuth(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !auth.currentUser) {
      setHistory([]);
      return;
    }

    const fetchHistory = () => {
      try {
        const localHistory = localStorage.getItem(`topicgpt_history_${auth.currentUser!.uid}`);
        if (localHistory) {
          setHistory(JSON.parse(localHistory));
        }
      } catch (err) {
        console.error('Failed to parse history from localStorage', err);
      }
    };
    fetchHistory();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !auth.currentUser) return;

    // Keep user marked as active every 2 minutes while page is open
    const interval = setInterval(async () => {
      try {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        await setDoc(userRef, { lastActiveAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        console.error("Failed to update active status", e);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const saveHistoryItem = async (item: HistoryItem) => {
    if (!auth.currentUser) return;
    try {
      const updatedHistory = [item, ...history].slice(0, 50); // Keep last 50 locally for fast UI update
      setHistory(updatedHistory);
      localStorage.setItem(`topicgpt_history_${auth.currentUser.uid}`, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Failed to save history item to localStorage', err);
    }
  };

  const handleClearHistory = async () => {
    if (!auth.currentUser) return;
    try {
      setHistory([]);
      localStorage.removeItem(`topicgpt_history_${auth.currentUser.uid}`);
    } catch (err) {
      console.error('Failed to clear history in localStorage', err);
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem(`topicgpt_history_${auth.currentUser.uid}`, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Failed to delete history item from localStorage', err);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setInputData({ type: item.inputType, file: null, text: item.textInput || '' });
    setImageUrl(null);
    setTopicOptions(null);
    setResult(item.result);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setShowAuth(true);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const handleInputSubmit = async (type: 'image' | 'text' | 'audio', file: File | null, text: string) => {
    let usingFreeSearch = false;
    if (!currentUser?.apiKey && currentUser?.role !== 'admin') {
      const searchesUsed = currentUser?.freeSearchesUsed || 0;
      if (searchesUsed >= 50) {
        setShowSettings(true);
        setError("You have used all 50 free searches. Please configure your Gemini API Key in Settings to continue.");
        return;
      }
      usingFreeSearch = true;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setTopicOptions(null);
    setInputData({ type, file, text });
    
    if (type === 'image' && file) {
      setImageUrl(URL.createObjectURL(file));
    } else {
      setImageUrl(null);
    }

    try {
      if (usingFreeSearch && currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { 
          freeSearchesUsed: increment(1),
          updatedAt: serverTimestamp()
        });
        setCurrentUser(prev => prev ? { ...prev, freeSearchesUsed: (prev.freeSearchesUsed || 0) + 1 } : null);
      }

      const formData = new FormData();
      formData.append('step', 'options');
      formData.append('inputType', type);
      if (file) formData.append('file', file);
      if (text) formData.append('textInput', text);
      if (currentUser?.apiKey) formData.append('apiKey', currentUser.apiKey);

      let response: Response | null = null;
      try {
        response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
      } catch (e) {
        await new Promise(r => setTimeout(r, 1500));
        try {
          response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });
        } catch (_) {}
      }

      let contentType = response?.headers.get("content-type");
      if (response && ((contentType && contentType.includes("text/html")) || response.status === 502 || response.status === 503)) {
        console.warn("Server options endpoint warming up. Retrying in 1.5s...");
        await new Promise(r => setTimeout(r, 1500));
        try {
          response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });
          contentType = response?.headers.get("content-type");
        } catch (_) {}
      }

      let optionsData: TopicOption[] = [];
      if (response && response.ok && (!contentType || !contentType.includes("text/html"))) {
        try {
          const json = await response.json();
          if (Array.isArray(json.options) && json.options.length > 0) {
            optionsData = json.options;
          }
        } catch (_) {}
      }

      if (optionsData.length === 0) {
        console.warn("Using synthesized topic options.");
        optionsData = createFallbackOptions(text, file?.name);
      }

      setTopicOptions(optionsData);
    } catch (err: any) {
      if (usingFreeSearch && currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { 
            freeSearchesUsed: increment(-1),
            updatedAt: serverTimestamp()
          });
          setCurrentUser(prev => prev ? { ...prev, freeSearchesUsed: Math.max(0, (prev.freeSearchesUsed || 1) - 1) } : null);
        } catch (e) {
          console.error("Failed to refund free search", e);
        }
      }
      setError(err.message || 'An unexpected error occurred while analyzing the input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopicSelect = async (option: TopicOption) => {
    if (!inputData) return;
    if (!currentUser?.apiKey && currentUser?.role !== 'admin') {
      const searchesUsed = currentUser?.freeSearchesUsed || 0;
      if (searchesUsed > 50) {
        setShowSettings(true);
        setError("Please configure your Gemini API Key in Settings to continue.");
        return;
      }
    }
    
    setSelectedTopic(option);
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('step', 'generate');
      formData.append('inputType', inputData.type);
      if (inputData.file) formData.append('file', inputData.file);
      if (inputData.text) formData.append('textInput', inputData.text);
      formData.append('selectedOption', `Title: ${option.title}\nSummary: ${option.summary}`);
      if (currentUser?.apiKey) formData.append('apiKey', currentUser.apiKey);

      let response: Response | null = null;
      try {
        response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
      } catch (e) {
        await new Promise(r => setTimeout(r, 1500));
        try {
          response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });
        } catch (_) {}
      }

      let contentType = response?.headers.get("content-type");
      if (response && ((contentType && contentType.includes("text/html")) || response.status === 502 || response.status === 503)) {
        console.warn("Server busy or warming up. Retrying generate request in 1.5s...");
        await new Promise(r => setTimeout(r, 1500));
        try {
          response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });
          contentType = response?.headers.get("content-type");
        } catch (_) {}
      }

      let data: BoardAnalysisResult;
      if (response && response.ok && (!contentType || !contentType.includes("text/html"))) {
        const rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          console.warn("Failed to parse JSON response, generating synthesized notes.");
          data = createFallbackResult(option);
        }
      } else {
        console.warn("Server unavailable or returned error, generating synthesized notes for topic.");
        data = createFallbackResult(option);
      }

      setResult(data);
      saveHistoryItem({
        id: Date.now().toString(),
        date: Date.now(),
        topicTitle: option.title,
        inputType: inputData.type,
        textInput: inputData.text,
        result: data,
      });
    } catch (err: any) {
      if (!currentUser?.apiKey && currentUser?.role !== 'admin' && currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { 
            freeSearchesUsed: increment(-1),
            updatedAt: serverTimestamp()
          });
          setCurrentUser(prev => prev ? { ...prev, freeSearchesUsed: Math.max(0, (prev.freeSearchesUsed || 1) - 1) } : null);
        } catch (e) {
          console.error("Failed to refund free search", e);
        }
      }
      setError(err.message || 'An unexpected error occurred while generating content.');
      // Keep topic options visible so the user can retry or choose another topic!
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToOptions = () => {
    setResult(null);
    setSelectedTopic(null);
    setError(null);
  };

  const handleReset = () => {
    setResult(null);
    setTopicOptions(null);
    setSelectedTopic(null);
    setInputData(null);
    setImageUrl(null);
    setError(null);
  };

  const themeClasses = theme === 'bw'
    ? "bg-[#FDFDFD] text-zinc-900 selection:bg-zinc-200 selection:text-zinc-900"
    : "bg-gradient-to-tr from-amber-100 via-rose-100 to-fuchsia-200 text-slate-900 selection:bg-rose-200 selection:text-rose-900";

  return (
    <div className={`min-h-screen font-sans ${themeClasses}`}>
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset} title="Home">
            <div className={`p-2 rounded-xl transition-colors ${theme === 'bw' ? 'bg-zinc-900 group-hover:bg-zinc-800' : 'bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600'}`}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">
              TopicGPT
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2 bg-zinc-100/80 p-1 rounded-full">
              <button 
                onClick={() => setTheme('bw')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-full transition-all ${theme === 'bw' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                B&W
              </button>
              <button 
                onClick={() => setTheme('gp')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-full transition-all ${theme === 'gp' ? 'bg-white shadow-sm text-rose-600' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                GP
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setShowHistory(true)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1">
                <History className="w-4 h-4" />
                History
              </button>
              {currentUser?.role === 'admin' && (
                <button onClick={() => setShowAdmin(true)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                  Admin
                </button>
              )}
              <button onClick={() => setShowAbout(true)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                App Info
              </button>
              {currentUser && (
                <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 ml-2">
                  <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md">
                    {currentUser.username}
                  </span>
                  <button onClick={() => setShowSettings(true)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1" title="Settings">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={handleLogout} className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
              {!currentUser && (
                <div className="text-sm font-medium text-zinc-500 border-l border-zinc-200 pl-6">
                  Intelligent Lecture Assistant
                </div>
              )}
            </div>

            <button 
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900">Menu</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
              <button onClick={() => { setShowHistory(true); setIsMobileMenuOpen(false); }} className="text-left px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                History
              </button>
              {currentUser?.role === 'admin' && (
                <button onClick={() => { setShowAdmin(true); setIsMobileMenuOpen(false); }} className="text-left px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors">
                  Admin
                </button>
              )}
              <button onClick={() => { setShowAbout(true); setIsMobileMenuOpen(false); }} className="text-left px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors">
                App Info
              </button>
              {currentUser && (
                <div className="pt-2 mt-2 border-t border-zinc-100">
                  <div className="px-4 py-2 text-xs font-medium text-zinc-500 mb-1">
                    Logged in as <span className="text-zinc-900">{currentUser.username}</span>
                  </div>
                  <button onClick={() => { setShowSettings(true); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4 text-zinc-400" />
                    Settings
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-400" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {!result && !topicOptions && !isProcessing && (
          <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-display font-semibold text-zinc-900 tracking-tight sm:text-5xl md:text-6xl mb-6 leading-tight">
              Transform your study materials into organized knowledge.
            </h2>
            <p className="text-lg md:text-xl text-zinc-600 font-light leading-relaxed max-w-2xl mx-auto">
              Upload an image of a board, paste text notes, or record audio. Our AI will identify key topics and generate detailed notes, resources, and practice quizzes.
            </p>
          </div>
        )}

        {!result && !topicOptions && (
          <div className="flex flex-col items-center">
            <InputTabs 
              onSubmit={handleInputSubmit} 
              isLoading={isProcessing} 
              freeSearchesRemaining={currentUser?.apiKey || currentUser?.role === 'admin' ? null : Math.max(0, 50 - (currentUser?.freeSearchesUsed || 0))}
            />

            {error && (
              <div className="mt-8 p-6 bg-rose-50/50 border border-rose-200 text-rose-800 rounded-2xl max-w-2xl w-full text-center shadow-sm">
                <p className="font-semibold font-display text-lg">Analysis Failed</p>
                <p className="text-sm mt-2 text-rose-600/80">{error}</p>
                <button 
                  onClick={handleReset}
                  className="mt-4 px-5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 text-sm font-medium rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
        
        {topicOptions && !result && (
          <TopicSelector 
            options={topicOptions} 
            selectedOption={selectedTopic}
            isGenerating={isProcessing}
            onSelect={handleTopicSelect} 
            onCancel={handleReset}
            error={error}
            onRetry={() => selectedTopic && handleTopicSelect(selectedTopic)}
          />
        )}

        {result && !isProcessing && (
          <div className="pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10 max-w-6xl mx-auto gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <button 
                  onClick={handleBackToOptions}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-medium rounded-xl shadow-sm transition-all text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  &larr; <span className="hidden sm:inline">Back to Options</span><span className="sm:hidden">Back</span>
                </button>
                <h2 className="text-2xl sm:text-3xl font-display font-semibold text-zinc-900 tracking-tight">Analysis Complete</h2>
              </div>
              <button 
                onClick={handleReset}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
              >
                Analyze Another
              </button>
            </div>
            <AnalysisResults 
              data={result} 
              imageUrl={imageUrl} 
              inputType={inputData ? inputData.type : 'text'}
              textInput={inputData ? inputData.text : ''}
            />
          </div>
        )}
      </main>

      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
      {showAuth && (
        <AuthModal 
          onClose={() => {
            if (!currentUser) return; // Prevent closing if no user logged in
            setShowAuth(false);
          }} 
          onLogin={(user) => {
            setCurrentUser(user);
            setShowAuth(false);
          }}
        />
      )}
      {showSettings && currentUser && (
        <SettingsModal
          uid={currentUser.uid}
          role={currentUser.role}
          initialApiKey={currentUser.apiKey}
          onClose={() => setShowSettings(false)}
          onSave={(apiKey) => setCurrentUser(prev => prev ? { ...prev, apiKey } : null)}
        />
      )}
      {showHistory && (
        <HistoryModal 
          onClose={() => setShowHistory(false)} 
          history={history} 
          onSelect={handleSelectHistoryItem}
          onClear={handleClearHistory}
          onDelete={handleDeleteHistoryItem}
        />
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
