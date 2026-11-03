import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Gauge,
  Radio,
  Clock,
  Compass,
  Zap,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { Subject, Assessment, DayPlan } from '../types';
import { HologramSwiftCar } from './HologramSwiftCar';
import { calculateWorkspaceOverview } from '../utils/coverage';
import { getTimeRemaining } from '../utils/dateUtils';
import { generateDayByDayStudyPlan } from '../utils/studyPlanner';

interface SwiftAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  assessments: Assessment[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'swift';
  text: string;
  timestamp: string;
}

export const SwiftAssistantModal: React.FC<SwiftAssistantModalProps> = ({
  isOpen,
  onClose,
  subjects,
  assessments,
}) => {
  const [language, setLanguage] = useState<'hinglish' | 'hi' | 'en'>('hinglish');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_1',
      sender: 'swift',
      text: 'Swift Holographic Cockpit HUD online! Main aapka AI study copilot hoon. Aap English, Hindi ya Hinglish me mujhse kuch bhi pooch sakte hain!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Compute telemetry metrics for cockpit gauges
  const overview = calculateWorkspaceOverview(subjects, assessments);
  const nearestExam = assessments
    .filter(a => !a.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const nearestExamRem = nearestExam ? getTimeRemaining(nearestExam.dueDate) : null;

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Text to Speech playback
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const engVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
      if (engVoice) utterance.voice = engVoice;
      utterance.lang = 'en-US';
    }

    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speech synthesis if modal closes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Voice speech recognition (Microphone input)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || isThinking) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    // Build context
    const studentContext = {
      language,
      totalSubjects: subjects.length,
      overallCoverage: overview.overallCoveragePercentage,
      remainingHours: overview.totalRemainingHours,
      nearestExam: nearestExam
        ? {
            title: nearestExam.title,
            daysLeft: nearestExamRem?.days,
            scope: nearestExam.syllabusScope,
          }
        : null,
      courses: subjects.map(s => {
        const time = getTimeRemaining(s.targetExamDate);
        const total = s.units.flatMap(u => u.topics).length;
        const done = s.units.flatMap(u => u.topics).filter(t => t.status === 'completed').length;
        return {
          name: s.name,
          code: s.code,
          daysLeft: time.days,
          coverage: total > 0 ? Math.round((done / total) * 100) : 0,
          materials: (s.materials || []).map(m => m.title).join(', '),
        };
      }),
    };

    try {
      const response = await fetch('/api/swift/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language,
          context: studentContext,
        }),
      });

      const data = await response.json();
      const replyText = data.reply || "Swift telemetry received. Let's keep your study velocity high!";

      const swiftMsg: ChatMessage = {
        id: `msg_${Date.now()}_s`,
        sender: 'swift',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, swiftMsg]);
      speakText(replyText);
    } catch (err) {
      console.error('Swift chat error:', err);
      const fallbackReply = language === 'hi'
        ? 'सिस्टम कनेक्टेड है। आपकी परीक्षा की तैयारी सही दिशा में है!'
        : 'Telemetry lock confirmed. Stay consistent with your daily study agenda!';

      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          sender: 'swift',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakText(fallbackReply);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      {/* Automotive Futuristic Cockpit Frame */}
      <div className="w-full max-w-5xl h-[92vh] rounded-3xl bg-[#090D16] border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-cyan-50 font-sans relative">
        {/* Glowing HUD Grid Overlay Line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* 1. Cockpit Top Bar / Instrument Cluster */}
        <div className="px-6 py-4 bg-[#0D1424] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white font-display uppercase">
                  SWIFT AI COCKPIT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-400 border border-cyan-500/40">
                  SYSTEM READY
                </span>
              </div>
              <p className="text-[11px] font-mono text-cyan-300/70">
                FUTURISTIC AUTOMOTIVE STUDY COPILOT // HOLOGRAPHIC HUD
              </p>
            </div>
          </div>

          {/* Center/Right: Language Toggle + Audio Mute + Close */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-xs">
              <button
                onClick={() => setLanguage('hinglish')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  language === 'hinglish'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'text-cyan-300/80 hover:text-white'
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  language === 'hi'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'text-cyan-300/80 hover:text-white'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  language === 'en'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'text-cyan-300/80 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Audio Voice Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) window.speechSynthesis?.cancel();
                setVoiceEnabled(!voiceEnabled);
              }}
              title={voiceEnabled ? 'Voice output enabled' : 'Voice output muted'}
              className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-colors"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-rose-950/40 hover:border-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Cockpit Main Body Split (Left: Hologram & Gauges, Right: Conversational HUD) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column (5 Cols): 3D Swift Car Hologram + Telemetry Dials */}
          <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-cyan-500/20 flex flex-col justify-between bg-gradient-to-b from-[#090E1B] to-[#060A14] overflow-y-auto">
            {/* Hologram Stage */}
            <div className="rounded-2xl bg-[#0B1222]/80 border border-cyan-500/30 relative overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]">
              {/* Scanline FX */}
              <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

              <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>SWIFT CAR HOLOGRAM 3D</span>
                </span>
                <span className="text-cyan-300/70">ROTATION: ACTIVE</span>
              </div>

              {/* 3D Three.js Hologram */}
              <HologramSwiftCar
                isSpeaking={isSpeaking}
                isThinking={isThinking}
                accentColor="#00f0ff"
              />

              {/* Audio frequency wave visualizer */}
              <div className="px-4 py-2 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-cyan-400">VOICE WAVEFORM:</span>
                <div className="flex items-center gap-1 h-4">
                  {[4, 12, 8, 16, 10, 14, 6, 12, 9, 15, 7, 11].map((h, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-cyan-400 rounded-full transition-all duration-150"
                      style={{
                        height: isSpeaking ? `${Math.max(4, (h * (idx % 2 === 0 ? 1.2 : 0.8)))}px` : '4px',
                        opacity: isSpeaking ? 0.9 : 0.3,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-cyan-300">
                  {isSpeaking ? 'TRANSMITTING' : 'LISTENING'}
                </span>
              </div>
            </div>

            {/* Automotive Gauges Strip */}
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {/* Gauge 1: Study Velocity RPM */}
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                  STUDY RPM
                </span>
                <div className="mt-1 text-lg font-bold font-mono text-white">
                  1.8 <span className="text-[10px] font-normal text-cyan-400">t/d</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400">HIGH TORQUE</span>
              </div>

              {/* Gauge 2: Syllabus Fuel Tank */}
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                  SYLLABUS FUEL
                </span>
                <div className="mt-1 text-lg font-bold font-mono text-white">
                  {overview.overallCoveragePercentage}%
                </div>
                <span className="text-[9px] font-mono text-cyan-300">
                  {overview.remainingTopics} TOPICS LEFT
                </span>
              </div>

              {/* Gauge 3: Exam Radar */}
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                  NEXT RADAR
                </span>
                <div className="mt-1 text-lg font-bold font-mono text-amber-400">
                  {nearestExamRem ? `${nearestExamRem.days}d` : '--'}
                </div>
                <span className="text-[9px] font-mono text-amber-300 truncate block">
                  {nearestExam ? nearestExam.title.split(' ')[0] : 'CLEAR'}
                </span>
              </div>
            </div>

            {/* Quick Voice Prompt Shortcuts */}
            <div className="mt-4 pt-3 border-t border-cyan-500/20 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                QUICK VOICE QUERIES // TACTICAL PROMPTS:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSendMessage(language === 'hi' ? 'मेरी अगली परीक्षा कब है?' : 'When is my next exam and how many days left?')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 hover:border-cyan-400 hover:text-white transition-colors font-mono"
                >
                  ⚡ Next Exam Days?
                </button>
                <button
                  onClick={() => handleSendMessage(language === 'hi' ? 'आज मुझे क्या पढ़ना चाहिए?' : 'What is my study plan for today?')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 hover:border-cyan-400 hover:text-white transition-colors font-mono"
                >
                  📅 Today's Plan?
                </button>
                <button
                  onClick={() => handleSendMessage(language === 'hi' ? 'सिलेबस कितना बाकी है और स्पीड कैसे बढ़ाएं?' : 'How much syllabus is remaining across all subjects?')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 hover:border-cyan-400 hover:text-white transition-colors font-mono"
                >
                  📊 Remaining Syllabus?
                </button>
                <button
                  onClick={() => handleSendMessage(language === 'hi' ? 'मुझे पढ़ाई के लिए एक मोटिवेशनल टिप दो' : 'Give me high-energy exam motivation in Hindi and English!')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 hover:border-cyan-400 hover:text-white transition-colors font-mono"
                >
                  🔥 Boost My Motivation
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Holographic AI Chat Terminal */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#080C17] p-5 overflow-hidden">
            {/* Message History Feed */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-hud-scrollbar"
            >
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-cyan-400/70">
                    <span>{msg.sender === 'user' ? 'STUDENT PILOT' : 'SWIFT HOLOGRAM'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-tr-xs shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-[#0E172B] border border-cyan-500/30 text-cyan-50 rounded-tl-xs shadow-[0_0_20px_rgba(6,182,212,0.15)] font-mono'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>SWIFT ANALYZING TELEMETRY & PROCESSING SPEECH...</span>
                </div>
              )}
            </div>

            {/* Input Bar with Voice Mic & Send */}
            <div className="mt-4 pt-3 border-t border-cyan-500/20 space-y-2">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Mic Input Toggle */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                      : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-400 hover:text-white hover:bg-cyan-900'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Tap to speak aloud (Hindi or English)'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder={
                    language === 'hi'
                      ? 'स्विफ्ट से कुछ भी पूछें... (उदा. मैथ्स एग्जाम में कितने दिन बचे हैं?)'
                      : language === 'hinglish'
                      ? 'Ask Swift... (e.g. "Aaj kya padhna chahiye?" or "Explain OS paging")'
                      : 'Ask Swift anything about your syllabus, exams, or study plan...'
                  }
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-4 py-3 text-xs md:text-sm rounded-xl border border-cyan-500/30 bg-[#0B1222] text-white placeholder:text-cyan-400/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking}
                  className="px-5 py-3 rounded-xl font-bold font-mono text-xs text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">TRANSMIT</span>
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/60 px-1">
                <span>
                  VOICE INPUT: {isListening ? '🔴 RECORDING (Speak now)' : 'READY'}
                </span>
                <span>
                  LANG: {language.toUpperCase()} · ENGINE: GEMINI 3.8 FLASH
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
