import React, { useState, useEffect } from 'react';
import { PlacedRoom, UserProfile, PropertyRecord } from '../types';
import { calculateHouseAudit, playTempleBellChime } from '../utils/vastuUtils';
import { searchOfflineVastuDb, saveVastuRuleItem, getVastuDbStats } from '../utils/vastuKnowledgeDb';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  RefreshCw,
  HelpCircle,
  ShieldAlert,
  Database,
  Zap,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  SendHorizontal,
  Mail,
  Phone,
  Building,
  Compass,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Layers,
} from 'lucide-react';

export interface ForumConsultationItem {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  phone?: string;
  propertyType: string;
  facingDirection: string;
  topic: string;
  reportRefNumber?: string;
  question: string;
  status: 'pending' | 'replied' | 'closed';
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

interface AIVastuGuruViewProps {
  placedRooms: PlacedRoom[];
  currentDegree: number;
  userProfile?: UserProfile;
  activeProperty?: PropertyRecord;
}

export const AIVastuGuruView: React.FC<AIVastuGuruViewProps> = ({ placedRooms, currentDegree, userProfile, activeProperty }) => {
  const [subTab, setSubTab] = useState<'chat' | 'forum_submit' | 'my_threads'>('chat');

  // Active Audit Report Ref & Saved Audit Reports State
  const [activeReportRef, setActiveReportRef] = useState<string>(() => {
    return localStorage.getItem('vastu_active_report_ref') || '';
  });
  const [savedAuditReports, setSavedAuditReports] = useState<any[]>([]);

  // Listen for report ref updates from HouseAuditorView
  useEffect(() => {
    const handleRefUpdate = () => {
      const ref = localStorage.getItem('vastu_active_report_ref');
      if (ref) setActiveReportRef(ref);
    };
    window.addEventListener('vastu_active_report_updated', handleRefUpdate);
    return () => window.removeEventListener('vastu_active_report_updated', handleRefUpdate);
  }, []);

  // Load saved audit reports from localStorage
  useEffect(() => {
    try {
      const localStr = localStorage.getItem('vastu_saved_audit_reports') || '[]';
      const parsed = JSON.parse(localStr);
      if (Array.isArray(parsed)) {
        setSavedAuditReports(parsed);
      }
    } catch (e) {
      console.warn('Error loading saved audit reports:', e);
    }
  }, [subTab]);

  // Chat State
  const [question, setQuestion] = useState('');
  const [propertyType, setPropertyType] = useState<'Flat/Apartment' | 'Independent House' | 'Plot' | 'Commercial/Office'>('Flat/Apartment');
  const [houseFacing, setHouseFacing] = useState('East');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState(getVastuDbStats());
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: 'user' | 'guru'; text: string; time: string; isOfflineHit?: boolean }>
  >([
    {
      role: 'guru',
      text: `Namaste! I am your 7Tasker Vastu Compass Support & App Assistant.\n\nI can help you with:\n• ⏰ **Customer Support Timings & Official Contacts**\n• 💳 **Account, Pro Plans & PDF Report Unlocks**\n• 💾 **Saving, Loading & Backing Up Layouts / Properties**\n• 🧭 **How to Use App Features** (Compass, House Audit, Remedies, Pooja Vidhi, Muhurta & 16-Zone Mandala)\n\nFeel free to ask a question below or choose a quick prompt!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Forum Submission Form State - Sync with UserProfile & ActiveProperty
  const [formName, setFormName] = useState(userProfile?.name || 'Vedic Architect User');
  const [formEmail, setFormEmail] = useState(userProfile?.email || 'guest@vastu-app.in');
  const [formPhone, setFormPhone] = useState('');
  const [formPropertyType, setFormPropertyType] = useState('Flat/Apartment');
  const [formFacing, setFormFacing] = useState('East');
  const [formTopic, setFormTopic] = useState('Main Door Vastu Remedy');
  const [formReportRef, setFormReportRef] = useState(activeReportRef || '');
  const [formQuestion, setFormQuestion] = useState('');
  const [submittingForum, setSubmittingForum] = useState(false);
  const [forumSuccessMsg, setForumSuccessMsg] = useState<string | null>(null);

  // Keep formName & formEmail continuously in sync with userProfile
  useEffect(() => {
    if (userProfile?.name) {
      setFormName(userProfile.name);
    }
    if (userProfile?.email) {
      setFormEmail(userProfile.email);
    }
  }, [userProfile?.name, userProfile?.email]);

  // Keep formPropertyType & formFacing in sync with activeProperty
  useEffect(() => {
    if (activeProperty?.propertyType) {
      setFormPropertyType(activeProperty.propertyType);
    }
    if (activeProperty?.facingDegree !== undefined) {
      setFormFacing(`${activeProperty.facingDegree}°`);
    }
  }, [activeProperty]);

  // My Consultation Threads State
  const [consultationThreads, setConsultationThreads] = useState<ForumConsultationItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);

  // Calculate audit report using stable ref number
  const auditReport = calculateHouseAudit(placedRooms, formReportRef || activeReportRef || undefined);

  // Auto-fill formReportRef from activeReportRef or auditReport if blank
  useEffect(() => {
    if (!formReportRef) {
      const activeRef = localStorage.getItem('vastu_active_report_ref');
      if (activeRef) {
        setFormReportRef(activeRef);
      } else if (auditReport.reportRefNumber) {
        setFormReportRef(auditReport.reportRefNumber);
      }
    }
  }, [activeReportRef, auditReport.reportRefNumber, formReportRef]);

  // Load Consultation Threads from Firestore
  const fetchConsultationThreads = async () => {
    setLoadingThreads(true);
    try {
      const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
      const querySnap = await getDocs(q);
      const items: ForumConsultationItem[] = [];
      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || '',
          userName: data.userName || 'Anonymous Explorer',
          userEmail: data.userEmail || '',
          phone: data.phone || '',
          propertyType: data.propertyType || 'Property',
          facingDirection: data.facingDirection || 'East',
          topic: data.topic || 'General Vastu Query',
          reportRefNumber: data.reportRefNumber || '',
          question: data.question || '',
          status: data.status || 'pending',
          adminReply: data.adminReply || '',
          repliedAt: data.repliedAt || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setConsultationThreads(items);
    } catch (e) {
      console.warn('Notice loading consultations from Firestore:', e);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    if (subTab === 'my_threads') {
      fetchConsultationThreads();
    }
  }, [subTab]);

  const handleSubmitForumConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReportRef = formReportRef.trim() || auditReport.reportRefNumber || '';
    if (!formQuestion.trim() || !formEmail.trim() || !formName.trim()) {
      setErrorMsg('Please enter your Name, Email, and Query details.');
      return;
    }

    if (!finalReportRef) {
      setErrorMsg('⚠️ Report Reference Number is mandatory. Please enter or attach your Report Ref Number.');
      return;
    }

    setSubmittingForum(true);
    setErrorMsg(null);
    setForumSuccessMsg(null);

    try {
      const newConsultDoc = {
        userId: userProfile?.uid || 'guest',
        userName: formName.trim() || userProfile?.name || 'Vedic Architect User',
        userEmail: formEmail.trim() || userProfile?.email || 'guest@vastu-app.in',
        phone: formPhone.trim(),
        propertyType: formPropertyType,
        facingDirection: formFacing,
        topic: formTopic,
        reportRefNumber: finalReportRef,
        question: formQuestion.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'consultations'), newConsultDoc);
      playTempleBellChime();

      setForumSuccessMsg('Your consultation request has been submitted to Vastu Compass Admin Experts! You can view response in "My Inquiries" tab.');
      setFormQuestion('');
      
      setTimeout(() => {
        setSubTab('my_threads');
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit consultation request.';
      setErrorMsg(msg);
    } finally {
      setSubmittingForum(false);
    }
  };

  const handleConsult = async (queryText?: string) => {
    const promptToSend = queryText || question.trim();
    if (!promptToSend) return;

    const userMessage = {
      role: 'user' as const,
      text: promptToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    if (!queryText) setQuestion('');
    setLoading(true);
    setErrorMsg(null);
    setOfflineNotice(null);

    // 1. STEP ONE: Check Offline Vastu Shastra Database First
    const offlineMatch = searchOfflineVastuDb(promptToSend);

    if (offlineMatch.found && offlineMatch.formattedAnswer) {
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'guru',
            text: offlineMatch.formattedAnswer!,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOfflineHit: true,
          },
        ]);
        playTempleBellChime();
        setLoading(false);
        setOfflineNotice('⚡ Served from Offline Vastu Shastra Local DB (0 API Calls)');
        setDbStats(getVastuDbStats());
      }, 300);
      return;
    }

    // 2. STEP TWO: If not found in offline DB & online query allowed, consult Gemini API
    try {
      const response = await fetch('/api/vastu-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuestion: promptToSend,
          houseScore: auditReport.overallScore,
          houseFacingDirection: houseFacing,
          propertyType,
          placedRooms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to Vastu Guru.');
      }

      const answerText = data.answer || 'No response returned.';

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'guru',
          text: answerText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOfflineHit: false,
        },
      ]);
      playTempleBellChime();

      // Auto-save generated response to Offline DB so future queries hit local cache!
      const newRuleId = `rule_auto_${Date.now()}`;
      saveVastuRuleItem({
        id: newRuleId,
        category: 'General',
        title: `Auto-Cached Answer: ${promptToSend.slice(0, 40)}...`,
        keywords: promptToSend.toLowerCase().split(' ').filter((w) => w.length > 3),
        guideline: answerText,
        impact: 'Cached from AI Vastu Guru live session.',
        remedy: 'Apply remedies as detailed in guidance above.',
        element: 'Space',
        isCompactIncluded: true,
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });
      setDbStats(getVastuDbStats());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while consulting Vastu Guru.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'What are customer support timings and contact info?',
    'How do I upgrade to Pro and unlock my full PDF report?',
    'How do I save, load, or backup my property layout?',
    'How do I use the live compass and add rooms to audit my home?',
    'How do I use the Kalasham Pooja & Shubh Muhurta tools?',
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto pb-24 font-sans text-[#3D342D]">
      {/* Header Banner */}
      <div className="bg-[#78350F] text-[#F3EFE0] border border-[#5C280B] rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-sans font-extrabold px-2.5 py-0.5 rounded-full bg-[#D97706] text-white uppercase tracking-widest flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              Support & App Help Desk
            </span>
            <span className="text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#065F46] text-emerald-100 uppercase tracking-wider flex items-center gap-1 w-fit border border-[#047857]">
              <Database className="w-3 h-3 text-emerald-300" />
              Offline Help Active ({dbStats.compactRulesCount} Topics)
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold mt-2 text-white flex items-center gap-2">
            App Assistant & Customer Support
          </h2>
          <p className="text-xs text-[#E8DCC4] max-w-xl mt-1 leading-relaxed">
            Get instant answers regarding customer support hours, account & Pro memberships, saving house layouts, or step-by-step guidance on using app features.
          </p>
        </div>

        {/* Current Context Card */}
        <div className="bg-[#5C280B] border border-[#9A420F]/50 rounded-2xl p-3.5 text-xs space-y-1.5 shrink-0 w-full md:w-auto shadow-xs">
          <div className="text-[#E8DCC4] font-bold text-[10px] uppercase tracking-wider flex items-center justify-between gap-2">
            <span>Current Property:</span>
          </div>
          <div className="text-[#F3EFE0] text-[11px]">
            Score: <span className="font-serif font-bold text-[#D97706]">{auditReport.overallScore}%</span> • Facing: {houseFacing}
          </div>
          <div className="text-[#E8DCC4]/90 text-[11px]">Rooms Audited: {placedRooms.length}</div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="grid grid-cols-3 bg-[#FCFAF7] border border-[#E8DCC4] rounded-2xl p-1.5 gap-1 shadow-xs">
        <button
          onClick={() => setSubTab('chat')}
          className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-1.5 uppercase tracking-wide leading-tight ${
            subTab === 'chat'
              ? 'bg-[#78350F] text-[#F3EFE0] shadow-xs'
              : 'text-[#8B735B] hover:text-[#3D342D] hover:bg-[#F3EFE0]'
          }`}
        >
          <Bot className="w-4 h-4 text-[#D97706] shrink-0" />
          <span className="truncate max-w-full">AI Help & Support</span>
        </button>

        <button
          onClick={() => setSubTab('forum_submit')}
          className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-1.5 uppercase tracking-wide leading-tight ${
            subTab === 'forum_submit'
              ? 'bg-[#78350F] text-[#F3EFE0] shadow-xs'
              : 'text-[#8B735B] hover:text-[#3D342D] hover:bg-[#F3EFE0]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#D97706] shrink-0" />
          <span className="truncate max-w-full">Consultation</span>
        </button>

        <button
          onClick={() => setSubTab('my_threads')}
          className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-1.5 uppercase tracking-wide leading-tight ${
            subTab === 'my_threads'
              ? 'bg-[#78350F] text-[#F3EFE0] shadow-xs'
              : 'text-[#8B735B] hover:text-[#3D342D] hover:bg-[#F3EFE0]'
          }`}
        >
          <FileText className="w-4 h-4 text-[#D97706] shrink-0" />
          <span className="truncate max-w-full">My Inquiries</span>
        </button>
      </div>

      {/* TAB 1: INSTANT AI GURU CHAT */}
      {subTab === 'chat' && (
        <>
          {/* Property Setup Strip */}
          <div className="bg-[#FCFAF7] rounded-2xl border border-[#E8DCC4] p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#78350F] uppercase tracking-wider text-[10px]">Property Type:</span>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as typeof propertyType)}
                  className="bg-white border border-[#E8DCC4] rounded-lg p-1.5 font-medium outline-none text-[#3D342D]"
                >
                  <option value="Flat/Apartment">Flat / Apartment</option>
                  <option value="Independent House">Independent House</option>
                  <option value="Plot">Open Plot</option>
                  <option value="Commercial/Office">Commercial / Office</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-[#78350F] uppercase tracking-wider text-[10px]">House Facing:</span>
                <select
                  value={houseFacing}
                  onChange={(e) => setHouseFacing(e.target.value)}
                  className="bg-white border border-[#E8DCC4] rounded-lg p-1.5 font-medium outline-none text-[#3D342D]"
                >
                  <option value="North">North (Uttara)</option>
                  <option value="East">East (Purva)</option>
                  <option value="North-East">North-East (Eeshanya)</option>
                  <option value="South-East">South-East (Agneya)</option>
                  <option value="South">South (Dakshina)</option>
                  <option value="South-West">South-West (Nairrutya)</option>
                  <option value="West">West (Paschima)</option>
                  <option value="North-West">North-West (Vayu)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setChatHistory([chatHistory[0]])}
              className="text-xs font-bold uppercase tracking-wider text-[#8B735B] hover:text-[#78350F] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Chat
            </button>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'guru' && (
                  <div className="w-8 h-8 rounded-full bg-[#78350F] text-[#F3EFE0] border border-[#5C280B] flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Bot className="w-4 h-4 text-[#D97706]" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl max-w-2xl shadow-xs space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-[#78350F] text-[#F3EFE0] rounded-tr-xs border border-[#5C280B]'
                      : 'bg-[#FCFAF7] border border-[#E8DCC4] text-[#3D342D] rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-80 mb-1">
                    <span className="font-bold uppercase tracking-wider">{msg.role === 'user' ? 'You' : 'Support & App Assistant'}</span>
                    <span>{msg.time}</span>
                  </div>

                  {/* Render multi-line markdown text */}
                  <div className="whitespace-pre-line space-y-2 font-sans">{msg.text}</div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#3D342D] text-[#F3EFE0] flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-[#78350F] bg-[#FFFBEB] p-4 rounded-2xl border border-[#FEF3C7] max-w-md shadow-xs">
                <Loader2 className="w-5 h-5 animate-spin shrink-0 text-[#D97706]" />
                <span>Assistant is fetching support details and feature guidance...</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-4 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
                <ShieldAlert className="w-5 h-5 shrink-0 text-[#DC2626]" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Suggested Quick Question Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#8B735B] flex items-center gap-1 uppercase tracking-wider text-[10px]">
              <HelpCircle className="w-3.5 h-3.5 text-[#D97706]" /> Frequently Asked Support & App Questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleConsult(promptText)}
                  disabled={loading}
                  className="text-xs text-[#78350F] bg-[#F3EFE0] hover:bg-[#78350F] hover:text-[#F3EFE0] border border-[#E8DCC4] rounded-xl px-3 py-1.5 text-left transition-all shadow-2xs cursor-pointer"
                >
                  "{promptText}"
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConsult();
            }}
            className="flex gap-2 bg-[#FCFAF7] rounded-2xl border border-[#E8DCC4] p-2 shadow-md focus-within:ring-2 focus-within:ring-[#D97706]"
          >
            <input
              type="text"
              placeholder="Ask about support timings, Pro plans, saving layouts, or how to use any app tool..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              className="flex-1 text-xs px-3 py-2 bg-transparent outline-none text-[#3D342D] font-medium"
            />

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-2.5 bg-[#78350F] hover:bg-[#5C280B] disabled:opacity-50 text-[#F3EFE0] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Ask</span>
            </button>
          </form>
        </>
      )}

      {/* TAB 2: SUBMIT CONSULTATION FORUM INQUIRY */}
      {subTab === 'forum_submit' && (
        <div className="bg-[#FCFAF7] border border-[#E8DCC4] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E8DCC4] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#78350F] text-[#F3EFE0] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#78350F]">
                Submit Expert Vastu Consultation Inquiry
              </h3>
              <p className="text-xs text-[#8B735B]">
                Fill in your layout details below. Our admin Vastu experts will analyze your query and post detailed guidance directly to your account thread.
              </p>
            </div>
          </div>

          {forumSuccessMsg && (
            <div className="bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] p-4 rounded-2xl text-xs flex items-center gap-3 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
              <span className="font-semibold">{forumSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-4 rounded-2xl text-xs flex items-center gap-2 shadow-2xs">
              <ShieldAlert className="w-5 h-5 shrink-0 text-[#DC2626]" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitForumConsultation} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[#8B735B]" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F] mb-1">
                  Email Address * (For response notification)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#8B735B]" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F] mb-1">
                  Phone / WhatsApp (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#8B735B]" />
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F] mb-1">
                  Consultation Topic *
                </label>
                <select
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D] font-medium"
                >
                  <option value="Main Door Vastu Remedy">Main Door Vastu Remedy</option>
                  <option value="Kitchen & Toilet Orientation">Kitchen & Toilet Orientation</option>
                  <option value="Master Bedroom & Sleep Orientation">Master Bedroom & Sleep Orientation</option>
                  <option value="Pooja Room & Sacred Energy">Pooja Room & Sacred Energy</option>
                  <option value="Financial Growth & Career Obstacles">Financial Growth & Career Obstacles</option>
                  <option value="Complete House Plan Audit">Complete House Plan Audit</option>
                  <option value="Commercial / Office Vastu">Commercial / Office Vastu</option>
                  <option value="Other Non-Destructive Remedy">Other Non-Destructive Remedy</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F] mb-1">
                  Property Type
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-2.5 text-[#8B735B]" />
                  <select
                    value={formPropertyType}
                    onChange={(e) => setFormPropertyType(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D] font-medium"
                  >
                    <option value="Flat/Apartment">Flat / Apartment</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Plot">Open Plot</option>
                    <option value="Commercial/Office">Commercial / Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F] mb-1">
                  Facing Direction
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 absolute left-3 top-2.5 text-[#8B735B]" />
                  <select
                    value={formFacing}
                    onChange={(e) => setFormFacing(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D] font-medium"
                  >
                    <option value="East">East (Purva)</option>
                    <option value="North">North (Uttara)</option>
                    <option value="North-East">North-East (Eeshanya)</option>
                    <option value="South-East">South-East (Agneya)</option>
                    <option value="South">South (Dakshina)</option>
                    <option value="South-West">South-West (Nairrutya)</option>
                    <option value="West">West (Paschima)</option>
                    <option value="North-West">North-West (Vayu)</option>
                  </select>
                </div>
              </div>

              {/* Report Reference Number Input Field & Saved Reports Selector */}
              <div className="md:col-span-2 bg-[#FFFBEB] p-3.5 rounded-2xl border border-[#FDE68A] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F]">
                    Report Reference Number * (Synced with Audit)
                  </label>
                  {(auditReport.reportRefNumber || activeReportRef) && (
                    <button
                      type="button"
                      onClick={() => setFormReportRef(activeReportRef || auditReport.reportRefNumber || '')}
                      className="text-[10px] font-bold text-[#D97706] hover:underline flex items-center gap-1"
                    >
                      ⚡ Auto-Attach Active Audit #{activeReportRef || auditReport.reportRefNumber}
                    </button>
                  )}
                </div>

                {savedAuditReports.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-medium text-[#8B735B] mb-1">
                      Select from your Saved Audit Reports:
                    </label>
                    <select
                      value={formReportRef}
                      onChange={(e) => {
                        const selectedRef = e.target.value;
                        setFormReportRef(selectedRef);
                        const found = savedAuditReports.find((r) => r.reportRefNumber === selectedRef);
                        if (found) {
                          if (found.userName && userProfile?.name) setFormName(userProfile.name);
                          else if (found.userName) setFormName(found.userName);
                          if (found.userEmail && userProfile?.email) setFormEmail(userProfile.email);
                          else if (found.userEmail) setFormEmail(found.userEmail);
                          if (found.propertyType) setFormPropertyType(found.propertyType);
                          if (found.facingDirection) setFormFacing(found.facingDirection);
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DCC4] rounded-xl outline-none text-[11px] font-mono font-bold text-[#78350F]"
                    >
                      <option value="">-- Choose a Saved Audit Report --</option>
                      {savedAuditReports.map((rpt: any) => (
                        <option key={rpt.reportRefNumber} value={rpt.reportRefNumber}>
                          Ref #{rpt.reportRefNumber} • {rpt.propertyName || 'Property'} ({rpt.overallScore || 0}% Score)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-2.5 text-[#D97706]" />
                  <input
                    type="text"
                    required
                    value={formReportRef}
                    onChange={(e) => setFormReportRef(e.target.value)}
                    placeholder="e.g. RPT-2026-982143 (Mandatory Report Reference Number)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] font-mono font-bold text-[#78350F] text-xs"
                  />
                </div>

                {/* Live Sync Banner */}
                <div className="p-2 bg-white rounded-xl border border-[#FDE68A] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#78350F]">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Client Name: <strong>{formName || userProfile?.name || 'Vedic User'}</strong> ({formEmail || userProfile?.email})</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                    Audit Ref: {formReportRef || auditReport.reportRefNumber || 'Pending'}
                  </div>
                </div>

                <p className="text-[10px] text-[#8B735B]">
                  Report Reference Number is mandatory to allow our Vastu Shastri Ji to cross-examine your exact room coordinates & elemental scores.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78350F] mb-1">
                Detailed Inquiry / Problem Description *
              </label>
              <textarea
                required
                rows={4}
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="Describe your property layout, room positions (e.g. Toilet in North-East, Kitchen in South-West), specific symptoms (health, money loss, sleep issues), and any questions..."
                className="w-full p-3 bg-white border border-[#E8DCC4] rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D] leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submittingForum}
              className="w-full py-3.5 bg-[#78350F] hover:bg-[#5C280B] text-[#F3EFE0] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {submittingForum ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                  <span>Submitting to Vastu Experts...</span>
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4 text-[#D97706]" />
                  <span>Submit Consultation Forum Request</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MY INQUIRIES & REPLIES */}
      {subTab === 'my_threads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D97706]" />
              Submitted Consultation Forum Threads
            </h3>
            <button
              onClick={fetchConsultationThreads}
              disabled={loadingThreads}
              className="text-xs font-bold uppercase tracking-wider text-[#8B735B] hover:text-[#78350F] flex items-center gap-1 bg-[#FCFAF7] border border-[#E8DCC4] px-3 py-1.5 rounded-xl shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingThreads ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loadingThreads ? (
            <div className="bg-[#FCFAF7] border border-[#E8DCC4] rounded-2xl p-8 text-center text-xs text-[#8B735B] flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
              <span>Loading consultation threads from database...</span>
            </div>
          ) : consultationThreads.length === 0 ? (
            <div className="bg-[#FCFAF7] border border-[#E8DCC4] rounded-2xl p-8 text-center space-y-3">
              <p className="text-xs text-[#8B735B]">No consultation requests submitted yet.</p>
              <button
                onClick={() => setSubTab('forum_submit')}
                className="px-4 py-2 bg-[#78350F] text-[#F3EFE0] text-xs font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-4 h-4 text-[#D97706]" />
                Submit New Inquiry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {consultationThreads.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FCFAF7] border border-[#E8DCC4] rounded-2xl p-5 shadow-xs space-y-4"
                >
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DCC4] pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#78350F]">{item.topic}</span>
                        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#F3EFE0] border border-[#E8DCC4] font-medium text-[#8B735B]">
                          {item.propertyType} • {item.facingDirection} Facing
                        </span>
                        {item.reportRefNumber && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A] flex items-center gap-1">
                            Ref #: {item.reportRefNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8B735B] flex items-center gap-2">
                        <span>Submitted by: <strong>{item.userName}</strong> ({item.userEmail})</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {item.status === 'replied' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          Replied by Expert Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                          Pending Admin Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="text-xs text-[#3D342D] space-y-1 bg-white p-3.5 rounded-xl border border-[#E8DCC4]/80">
                    <div className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider">Your Inquiry:</div>
                    <p className="whitespace-pre-line leading-relaxed">{item.question}</p>
                  </div>

                  {/* Admin Reply Card */}
                  {item.status === 'replied' && item.adminReply && (
                    <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-4 text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] text-[#166534] font-bold border-b border-[#BBF7D0] pb-1.5">
                        <span className="flex items-center gap-1 uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                          Vastu Compass Admin Expert Response:
                        </span>
                        <span>{item.repliedAt ? new Date(item.repliedAt).toLocaleString() : ''}</span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed text-[#14532D] font-sans font-medium">
                        {item.adminReply}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

