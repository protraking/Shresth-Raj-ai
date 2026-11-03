import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  FileText,
  GraduationCap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, Unit, Topic, StudyMaterial, MaterialType } from '../types';
import { calculateDateFromDaysLeft } from '../utils/dateUtils';
import { playSuccessChime } from '../utils/audio';

interface EasyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComplete: (newSubject: Subject) => void;
}

export const EasyEntryModal: React.FC<EasyEntryModalProps> = ({
  isOpen,
  onClose,
  onSaveComplete,
}) => {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [daysLeft, setDaysLeft] = useState<number>(14);
  const [topicsText, setTopicsText] = useState('');
  const [materials, setMaterials] = useState<Array<{ title: string; type: MaterialType; scopeOrPages: string }>>([
    { title: 'Main Textbook / Guide', type: 'textbook', scopeOrPages: 'Chapters 1 to 5' },
    { title: 'Lecture Slides & Notes', type: 'slides', scopeOrPages: 'Weeks 1 to 8' },
  ]);

  if (!isOpen) return null;

  const handleAddMaterialRow = () => {
    setMaterials(prev => [
      ...prev,
      { title: '', type: 'practice_problems', scopeOrPages: '' },
    ]);
  };

  const handleRemoveMaterialRow = (idx: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMaterialChange = (idx: number, field: string, value: string) => {
    setMaterials(prev =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  // Quick 1-click sample filler
  const handleLoadSample = (sampleType: 'cs' | 'math' | 'bio') => {
    if (sampleType === 'cs') {
      setCourseName('Computer Systems & Networks');
      setCourseCode('CS 320');
      setDaysLeft(12);
      setTopicsText(`TCP/IP Architecture & OSI Model
Packet Switching & Routing Algorithms (OSPF, BGP)
Reliable Data Transfer (Go-Back-N, Selective Repeat)
DNS, HTTP/2, and TLS Security Handshake
Socket Programming & Network Security`);
      setMaterials([
        { title: 'Kurose & Ross: Computer Networking', type: 'textbook', scopeOrPages: 'Chapters 1-4' },
        { title: 'Wireshark Lab Captures & Slides', type: 'slides', scopeOrPages: 'Labs 1-4' },
        { title: 'Midterm Practice Question Set', type: 'practice_problems', scopeOrPages: '25 Problems' },
      ]);
    } else if (sampleType === 'math') {
      setCourseName('Discrete Mathematics & Probability');
      setCourseCode('MATH 180');
      setDaysLeft(10);
      setTopicsText(`Propositional & Predicate Logic
Mathematical Induction & Recursion
Combinatorics & Pigeonhole Principle
Discrete Probability & Bayes' Theorem
Graph Theory Basics & Euler Paths`);
      setMaterials([
        { title: 'Rosen: Discrete Mathematics 8th Ed.', type: 'textbook', scopeOrPages: 'Chapters 2, 5, 6, 7' },
        { title: 'Discussion Worksheet Problem Sets', type: 'practice_problems', scopeOrPages: 'Sets 1-6' },
      ]);
    } else {
      setCourseName('Biochemistry & Cellular Metabolism');
      setCourseCode('BIO 220');
      setDaysLeft(14);
      setTopicsText(`Enzyme Kinetics & Michaelis-Menten
Glycolysis & Pyruvate Dehydrogenase
Citric Acid Cycle & Electron Transport
Lipid Catabolism & Fatty Acid Beta-Oxidation
Amino Acid Degradation & Urea Cycle`);
      setMaterials([
        { title: 'Lehninger Principles of Biochemistry', type: 'textbook', scopeOrPages: 'Ch 6, 14, 16, 17' },
        { title: 'Metabolism Summary Pathway Charts', type: 'notes', scopeOrPages: 'Cheat sheets' },
        { title: 'Past Exam Multiple Choice Bank', type: 'past_paper', scopeOrPages: '50 MCQs' },
      ]);
    }
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    // 1. Process topics from lines
    const lines = topicsText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const subjectId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Build study materials
    const validMaterials: StudyMaterial[] = materials
      .filter(m => m.title.trim().length > 0)
      .map((m, idx) => ({
        id: `mat_${Date.now()}_${idx}`,
        subjectId,
        title: m.title.trim(),
        type: m.type,
        scopeOrPages: m.scopeOrPages.trim() || undefined,
        estimatedHours: 4.0,
      }));

    // If user provided no topics, create default unit topics
    const rawTopics = lines.length > 0 ? lines : [
      'Unit 1: Fundamentals and Principles',
      'Unit 2: Core Concepts and Analysis',
      'Unit 3: Applications and Problem Solving',
      'Unit 4: Review and Comprehensive Practice',
    ];

    const topics: Topic[] = rawTopics.map((line, idx) => {
      const cleanTitle = line.replace(/^[-*•\d.)\]]+\s*/, '');
      return {
        id: `top_${Date.now()}_${idx}`,
        title: cleanTitle || `Topic ${idx + 1}`,
        status: 'not_started',
        estimatedHours: 2.0,
        difficulty: idx % 3 === 2 ? 'hard' : idx % 2 === 1 ? 'medium' : 'easy',
        associatedMaterials: validMaterials.length > 0 ? [validMaterials[idx % validMaterials.length].id] : [],
      };
    });

    const units: Unit[] = [
      {
        id: `unit_${Date.now()}_main`,
        title: 'Core Curriculum & Syllabus Units',
        topics,
      },
    ];

    const targetExamDate = calculateDateFromDaysLeft(daysLeft, '09:00');

    const newSubject: Subject = {
      id: subjectId,
      name: courseName.trim(),
      code: courseCode.trim().toUpperCase() || 'CRS',
      color: 'indigo',
      targetExamDate,
      credits: 3,
      units,
      materials: validMaterials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    playSuccessChime();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

    onSaveComplete(newSubject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg font-display">
                Easy Course & Materials Entry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your course, days left, and study materials — we'll generate your exact day-by-day study schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Fillers */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Quick 1-Click Fill:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleLoadSample('cs')}
              className="px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Computer Networks (12d)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('math')}
              className="px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Discrete Math (10d)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('bio')}
              className="px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Biochemistry (14d)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGeneratePlan} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Course & Days Left */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[11px] font-bold">1</span>
              <span>Course & Exam Timeline</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Course / Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Operating Systems"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Days Left Until Exam *</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={daysLeft}
                    onChange={e => setDaysLeft(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 shrink-0">days</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Exam will be scheduled for{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                {new Date(calculateDateFromDaysLeft(daysLeft)).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </strong>
            </p>
          </div>

          {/* Section 2: Study Materials */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Study Materials to Cover</span>
              </div>
              <button
                type="button"
                onClick={handleAddMaterialRow}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Add your textbooks, lecture slides, video playlists, or question banks. The planner will assign these specific materials to each day.
            </p>

            <div className="space-y-2">
              {materials.map((mat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2.5 text-xs"
                >
                  <input
                    type="text"
                    placeholder="Material Title (e.g. Stewart Calculus 8th Ed.)"
                    value={mat.title}
                    onChange={e => handleMaterialChange(idx, 'title', e.target.value)}
                    className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />

                  <select
                    value={mat.type}
                    onChange={e => handleMaterialChange(idx, 'type', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="textbook">Textbook / Book</option>
                    <option value="slides">Lecture Slides</option>
                    <option value="notes">Lecture Notes / PDF</option>
                    <option value="practice_problems">Practice Problems</option>
                    <option value="past_paper">Past Exam Papers</option>
                    <option value="video">Video Playlist</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Pages / Chapters (e.g. Ch 1-4, p. 50-120)"
                    value={mat.scopeOrPages}
                    onChange={e => handleMaterialChange(idx, 'scopeOrPages', e.target.value)}
                    className="w-44 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />

                  {materials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterialRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Topics / Chapters */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[11px] font-bold">3</span>
              <span>Syllabus Topics or Chapters (1 per line)</span>
            </div>

            <p className="text-xs text-slate-500">
              Simply type or paste your topics below. You can paste directly from your course syllabus or outline:
            </p>

            <textarea
              rows={5}
              placeholder={`Example:
Chapter 1: Vectors and Linear Spaces
Chapter 2: Matrices and Inverses
Chapter 3: Determinants and Cramer's Rule
Chapter 4: Eigenvalues and Eigenvectors
Chapter 5: Linear Systems of Differential Equations`}
              value={topicsText}
              onChange={e => setTopicsText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {daysLeft} days until exam · Auto-paced study schedule
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!courseName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md disabled:opacity-50"
              >
                <span>Generate Day-by-Day Study Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
