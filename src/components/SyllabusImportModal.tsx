import React, { useState } from 'react';
import { Sparkles, FileText, X, Check, Loader2, ArrowRight } from 'lucide-react';
import { Subject, Unit, Assessment } from '../types';
import { calculateDateFromDaysLeft } from '../utils/dateUtils';

interface SyllabusImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  targetSubjectId?: string | null;
  onImportComplete: (
    subjectId: string,
    units: Unit[],
    newAssessments?: Assessment[],
    newSubjectMeta?: { name: string; code: string }
  ) => void;
}

export const SyllabusImportModal: React.FC<SyllabusImportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  targetSubjectId,
  onImportComplete,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    targetSubjectId || (subjects.length > 0 ? subjects[0].id : 'new')
  );
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUnits, setPreviewUnits] = useState<Unit[] | null>(null);
  const [previewAssessments, setPreviewAssessments] = useState<Assessment[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset templates for quick 1-click loading
  const templates = [
    {
      title: 'Computer Science: Algorithms & Graph Theory',
      code: 'CS 240',
      text: `Unit 1: Asymptotic Complexity & Divide-and-Conquer
- Big-O, Big-Omega, Master Theorem (3 hrs, medium)
- Merge Sort, Quick Sort and Selection in linear time (2.5 hrs, medium)
- Binary Heaps & Priority Queues (2 hrs, easy)

Unit 2: Graph Traversals & Shortest Paths
- Breadth-First Search & Depth-First Search (2.5 hrs, medium)
- Topological Sort & Strongly Connected Components (3.5 hrs, hard)
- Dijkstra's Algorithm & Bellman-Ford (4 hrs, hard)
- Minimum Spanning Trees (Kruskal & Prim) (3 hrs, medium)

Unit 3: Dynamic Programming & Greedy Approaches
- Memoization vs Tabulation & 0/1 Knapsack (3.5 hrs, hard)
- Longest Common Subsequence & Matrix Chain Multiplication (4 hrs, hard)
- Greedy Interval Scheduling & Huffman Coding (2.5 hrs, medium)

Midterm Exam scheduled in 10 days covering Units 1 and 2 (30% weight)
Final Exam scheduled in 24 days covering full course (40% weight)`,
    },
    {
      title: 'Multivariable Calculus & Vector Fields',
      code: 'MATH 202',
      text: `Unit 1: Partial Derivatives & Gradient Vectors
- Limits and continuity in multiple variables (2.5 hrs, medium)
- Directional derivatives and the gradient vector (3 hrs, medium)
- Tangent planes and linear approximations (2 hrs, easy)
- Lagrange multipliers and constrained extrema (3.5 hrs, hard)

Unit 2: Multiple Integrals
- Double integrals over general regions & polar coordinates (3 hrs, medium)
- Triple integrals in cylindrical and spherical coordinates (4 hrs, hard)
- Change of variables and the Jacobian matrix (3.5 hrs, hard)

Unit 3: Vector Calculus & Field Theorems
- Vector fields, curl, and divergence (2.5 hrs, medium)
- Line integrals and Fundamental Theorem for Line Integrals (3 hrs, medium)
- Green's Theorem in the plane (3 hrs, hard)
- Stokes' Theorem and the Divergence Theorem (4.5 hrs, hard)

Midterm Test in 8 days (25% weight)
Comprehensive Final in 18 days (40% weight)`,
    },
    {
      title: 'Cellular Biology & Genetics',
      code: 'BIO 150',
      text: `Module 1: Cell Membrane Transport & Signaling
- Phospholipid bilayer fluidity and membrane proteins (2 hrs, easy)
- Passive diffusion, active transport, and ion channels (2.5 hrs, medium)
- G-protein coupled receptors and secondary messengers (3.5 hrs, hard)

Module 2: Cellular Respiration & ATP Synthesis
- Glycolysis and pyruvate oxidation (2.5 hrs, medium)
- The Citric Acid Cycle & Electron Transport Chain (4 hrs, hard)
- Chemiosmosis and oxidative phosphorylation (3 hrs, hard)

Module 3: Molecular Genetics & Gene Expression
- DNA replication fidelity and repair mechanisms (3 hrs, medium)
- Transcription, mRNA processing, and splicing (3.5 hrs, hard)
- Translation, tRNA charging, and ribosomal kinetics (3 hrs, medium)

Lab Assignment 3 due in 6 days (15% weight)
Final Examination in 16 days (35% weight)`,
    },
  ];

  const handleLoadTemplate = (tpl: typeof templates[0]) => {
    setSyllabusText(tpl.text);
    if (selectedSubjectId === 'new') {
      setNewSubjectName(tpl.title);
      setNewSubjectCode(tpl.code);
    }
  };

  const handleParse = async () => {
    if (!syllabusText.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: syllabusText,
          subjectName: newSubjectName || 'Imported Course',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Transform data into Unit models
      const generatedUnits: Unit[] = (data.units || []).map((u: { title: string; topics: Array<{ title: string; estimatedHours?: number; difficulty?: string }> }, idx: number) => ({
        id: `u_${Date.now()}_${idx}`,
        title: u.title || `Unit ${idx + 1}`,
        topics: (u.topics || []).map((t, tIdx: number) => ({
          id: `top_${Date.now()}_${idx}_${tIdx}`,
          title: t.title,
          status: 'not_started' as const,
          estimatedHours: t.estimatedHours || 2.0,
          difficulty: (t.difficulty === 'easy' || t.difficulty === 'hard' ? t.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
        })),
      }));

      // Transform detected assessments
      const generatedAssessments: Assessment[] = (data.detectedAssessments || []).map((a: { title: string; type?: string; daysFromNow?: number; weightPercentage?: number; notes?: string }, idx: number) => ({
        id: `ass_gen_${Date.now()}_${idx}`,
        subjectId: selectedSubjectId === 'new' ? 'pending_new_subject' : selectedSubjectId,
        title: a.title,
        type: (['exam', 'assignment', 'quiz', 'project'].includes(a.type || '') ? a.type : 'exam') as Assessment['type'],
        dueDate: calculateDateFromDaysLeft(a.daysFromNow || 14, '10:00'),
        weightPercentage: a.weightPercentage || 20,
        isCompleted: false,
        syllabusScope: 'Generated from syllabus outline',
        notes: a.notes || '',
      }));

      setPreviewUnits(generatedUnits);
      setPreviewAssessments(generatedAssessments);

      if (data.subjectName && selectedSubjectId === 'new' && !newSubjectName) {
        setNewSubjectName(data.subjectName);
      }
      if (data.subjectCode && selectedSubjectId === 'new' && !newSubjectCode) {
        setNewSubjectCode(data.subjectCode);
      }
    } catch (err) {
      console.error('Parse error:', err);
      setStatusMessage('Parsing failed. Please verify syllabus text format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!previewUnits || previewUnits.length === 0) return;

    onImportComplete(
      selectedSubjectId,
      previewUnits,
      previewAssessments,
      selectedSubjectId === 'new'
        ? {
            name: newSubjectName.trim() || 'Imported Subject',
            code: newSubjectCode.trim().toUpperCase() || 'CRS 101',
          }
        : undefined
    );
    onClose();
  };

  const totalParsedTopics = previewUnits?.reduce((acc, u) => acc + u.topics.length, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                Syllabus Importer & Topic Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste your syllabus or lecture outline to automatically generate units, study hours, and exam deadlines.
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

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Target Subject Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Course / Subject
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="new">+ Create as New Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    Append to: {s.code ? `${s.code} · ` : ''}{s.name}
                  </option>
                ))}
              </select>

              {selectedSubjectId === 'new' && (
                <>
                  <input
                    type="text"
                    placeholder="Course Name (e.g. Algorithms)"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    className="flex-1 min-w-[150px] px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Code (CS 240)"
                    value={newSubjectCode}
                    onChange={e => setNewSubjectCode(e.target.value)}
                    className="w-24 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </>
              )}
            </div>
          </div>

          {/* Quick template buttons */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Quick Test Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {templates.map(tpl => (
                <button
                  key={tpl.code}
                  type="button"
                  onClick={() => handleLoadTemplate(tpl)}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  {tpl.code}: {tpl.title.split(':')[1] || tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Paste Syllabus Text / Course Outline:</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Supports markdown, bullet lists, or raw lecture schedules
              </span>
            </label>
            <textarea
              rows={6}
              placeholder="Paste units, chapters, lecture topics, and test dates here..."
              value={syllabusText}
              onChange={e => setSyllabusText(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* Parse Action Button */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleParse}
              disabled={isLoading || !syllabusText.trim()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing & Structuring Syllabus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Structure Syllabus & Extract Deadlines</span>
                </>
              )}
            </button>

            {statusMessage && (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {statusMessage}
              </span>
            )}
          </div>

          {/* Parsed Preview Section */}
          {previewUnits && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Check className="w-4 h-4" /> Ready to Import
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block">
                    Found {previewUnits.length} units with {totalParsedTopics} topics and{' '}
                    {previewAssessments.length} exam deadlines.
                  </span>
                </div>

                <button
                  onClick={handleConfirmImport}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  <span>Apply to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Units Preview list */}
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                {previewUnits.map(unit => (
                  <div key={unit.id} className="py-2 px-2">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {unit.title}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {unit.topics.length} topics ({unit.topics.map(t => t.title).slice(0, 3).join(', ')}
                      {unit.topics.length > 3 ? '...' : ''})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
