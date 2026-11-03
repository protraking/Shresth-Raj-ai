import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Flame,
  Gauge,
  CheckCheck,
  Edit2,
  X,
  BookOpen,
  FileText,
  Library,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, Topic, TopicStatus, DifficultyLevel, Unit, StudyMaterial } from '../types';
import { CoverageBar } from './CoverageBar';
import { ConfirmModal } from './ConfirmModal';
import { calculateSubjectCoverage } from '../utils/coverage';
import { formatPrettyDate, calculateDateFromDaysLeft, getTimeRemaining } from '../utils/dateUtils';
import { playSuccessChime } from '../utils/audio';

interface SubjectDetailViewProps {
  subject: Subject;
  onUpdateSubject: (updated: Subject) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onBack: () => void;
  onOpenSyllabusImport: (subjectId: string) => void;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  onUpdateSubject,
  onDeleteSubject,
  onBack,
  onOpenSyllabusImport,
}) => {
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});
  const [isEditingExamDate, setIsEditingExamDate] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isDeleteSubjectConfirmOpen, setIsDeleteSubjectConfirmOpen] = useState(false);
  const [daysLeftInput, setDaysLeftInput] = useState<number>(() => {
    const rem = getTimeRemaining(subject.targetExamDate);
    return Math.max(0, rem.days);
  });
  const [examDateInput, setExamDateInput] = useState<string>(subject.targetExamDate);

  // Quick topic adder state
  const [activeUnitForTopic, setActiveUnitForTopic] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicHours, setNewTopicHours] = useState('2.0');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<DifficultyLevel>('medium');

  // Quick unit adder state
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');

  // Search/filter topics
  const [topicFilter, setTopicFilter] = useState<'all' | 'remaining' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Study materials state
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<StudyMaterial['type']>('textbook');
  const [newMaterialScope, setNewMaterialScope] = useState('');

  const stats = calculateSubjectCoverage(subject);
  const timeRem = getTimeRemaining(subject.targetExamDate);

  const toggleUnitCollapse = (unitId: string) => {
    setCollapsedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleUpdateTopicStatus = (unitId: string, topicId: string, currentStatus: TopicStatus) => {
    let nextStatus: TopicStatus = 'not_started';
    if (currentStatus === 'not_started') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'completed';
    else if (currentStatus === 'completed') nextStatus = 'not_started';

    if (nextStatus === 'completed') {
      playSuccessChime();
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.65 },
      });
    }

    const updatedUnits = subject.units.map(unit => {
      if (unit.id !== unitId) return unit;
      return {
        ...unit,
        topics: unit.topics.map(t => {
          if (t.id !== topicId) return t;
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
          };
        }),
      };
    });

    onUpdateSubject({
      ...subject,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMarkAllUnitComplete = (unitId: string) => {
    playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    const updatedUnits = subject.units.map(unit => {
      if (unit.id !== unitId) return unit;
      return {
        ...unit,
        topics: unit.topics.map(t => ({
          ...t,
          status: 'completed' as TopicStatus,
          completedAt: new Date().toISOString(),
        })),
      };
    });

    onUpdateSubject({
      ...subject,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTopic = (unitId: string, topicId: string) => {
    const updatedUnits = subject.units.map(unit => {
      if (unit.id !== unitId) return unit;
      return {
        ...unit,
        topics: unit.topics.filter(t => t.id !== topicId),
      };
    });

    onUpdateSubject({
      ...subject,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRequestDeleteUnit = (unit: Unit) => {
    setUnitToDelete(unit);
  };

  const handleConfirmDeleteUnit = () => {
    if (!unitToDelete) return;
    const updatedUnits = subject.units.filter(u => u.id !== unitToDelete.id);
    onUpdateSubject({
      ...subject,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
    setUnitToDelete(null);
  };

  const handleAddTopic = (unitId: string) => {
    if (!newTopicTitle.trim()) return;

    const newTopic: Topic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newTopicTitle.trim(),
      status: 'not_started',
      estimatedHours: parseFloat(newTopicHours) || 2.0,
      difficulty: newTopicDifficulty,
    };

    const updatedUnits = subject.units.map(unit => {
      if (unit.id !== unitId) return unit;
      return {
        ...unit,
        topics: [...unit.topics, newTopic],
      };
    });

    onUpdateSubject({
      ...subject,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });

    setNewTopicTitle('');
    setActiveUnitForTopic(null);
  };

  const handleAddUnit = () => {
    if (!newUnitTitle.trim()) return;

    const newUnit: Unit = {
      id: `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newUnitTitle.trim(),
      topics: [],
    };

    onUpdateSubject({
      ...subject,
      units: [...subject.units, newUnit],
      updatedAt: new Date().toISOString(),
    });

    setNewUnitTitle('');
    setIsAddingUnit(false);
  };

  const handleSaveExamDateFromDays = () => {
    const calculatedDate = calculateDateFromDaysLeft(daysLeftInput);
    onUpdateSubject({
      ...subject,
      targetExamDate: calculatedDate,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingExamDate(false);
  };

  const handleSaveExactExamDate = () => {
    if (!examDateInput) return;
    onUpdateSubject({
      ...subject,
      targetExamDate: examDateInput,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingExamDate(false);
  };

  const handleAddMaterial = () => {
    if (!newMaterialTitle.trim()) return;

    const newMaterial: StudyMaterial = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectId: subject.id,
      title: newMaterialTitle.trim(),
      type: newMaterialType,
      scopeOrPages: newMaterialScope.trim() || undefined,
      estimatedHours: 4.0,
    };

    onUpdateSubject({
      ...subject,
      materials: [...(subject.materials || []), newMaterial],
      updatedAt: new Date().toISOString(),
    });

    setNewMaterialTitle('');
    setNewMaterialScope('');
    setIsAddingMaterial(false);
  };

  const handleDeleteMaterial = (materialId: string) => {
    onUpdateSubject({
      ...subject,
      materials: (subject.materials || []).filter(m => m.id !== materialId),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Back navigation & header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Subjects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSyllabusImport(subject.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Import / Paste Topics</span>
          </button>

          <button
            onClick={() => setIsAddingUnit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Unit / Chapter</span>
          </button>

          {onDeleteSubject && (
            <button
              type="button"
              onClick={() => setIsDeleteSubjectConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer"
              title="Delete this entire course"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Course</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Subject Banner & Pacing Summary */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{subject.code || 'COURSE'}</span>
              <span aria-hidden="true">·</span>
              <span>{subject.credits || 3} Credits</span>
              <span aria-hidden="true">·</span>
              <span>{subject.units.length} Units</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-display">
              {subject.name}
            </h1>
            {subject.notes && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                {subject.notes}
              </p>
            )}
          </div>

          {/* Days Left and Exam Target badge */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Target Exam:</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {formatPrettyDate(subject.targetExamDate)}
              </span>
              <button
                onClick={() => setIsEditingExamDate(prev => !prev)}
                className="ml-1 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                title="Edit Days Left / Exam Date"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {timeRem.isOverdue
                  ? `Overdue by ${Math.abs(timeRem.days)} days`
                  : `${stats.daysUntilExam} Days Left`}
              </span>
            </div>
          </div>
        </div>

        {/* Inline editor for Days Left or Exact Exam Date */}
        {isEditingExamDate && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Adjust Exam Deadline or Days Left
              </h4>
              <button onClick={() => setIsEditingExamDate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Option A: Quick Days Left slider / input */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  Quick Enter Days Left:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={daysLeftInput}
                    onChange={e => setDaysLeftInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-1.5 text-sm font-mono font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500">days until exam</span>
                  <button
                    onClick={handleSaveExamDateFromDays}
                    className="ml-auto px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                  >
                    Set Days
                  </button>
                </div>
              </div>

              {/* Option B: Exact Date Picker */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  Or Pick Specific Date & Time:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={examDateInput}
                    onChange={e => setExamDateInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveExactExamDate}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                  >
                    Save Date
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coverage Progress Bar with Detailed metrics */}
        <div className="pt-2">
          <CoverageBar
            completedPercentage={stats.coveragePercentage}
            inProgressPercentage={Math.round((stats.inProgressTopics / Math.max(1, stats.totalTopics)) * 100)}
            color={subject.color}
            size="lg"
            totalTopics={stats.totalTopics}
            completedTopics={stats.completedTopics}
            remainingTopics={stats.notStartedTopics + stats.inProgressTopics}
          />
        </div>

        {/* Study Velocity / Pacing Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Remaining Coverage</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {stats.remainingPercentage}%
              </span>
              <span className="text-xs text-slate-500">
                ({stats.notStartedTopics + stats.inProgressTopics} topics)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Remaining Study Time</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {stats.remainingEstimatedHours}
              </span>
              <span className="text-xs text-slate-500">hours</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Daily Target Rate</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-bold font-mono tabular-nums ${stats.velocity.isCrunch ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {stats.velocity.topicsPerDay}
              </span>
              <span className="text-xs text-slate-500">topics / day</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Pacing Status</span>
            <div className="mt-1 flex items-center gap-1.5">
              {stats.coveragePercentage >= 100 ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCheck className="w-4 h-4" /> 100% Prepared
                </span>
              ) : stats.velocity.isCrunch ? (
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Flame className="w-4 h-4" /> Crunch Pace
                </span>
              ) : (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Gauge className="w-4 h-4" /> On Schedule
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Study Materials Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Course Study Materials & Resources
            </h3>
            <span className="text-xs text-slate-400">
              ({subject.materials?.length || 0} materials)
            </span>
          </div>

          <button
            onClick={() => setIsAddingMaterial(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Study Material</span>
          </button>
        </div>

        {/* Add material form */}
        {isAddingMaterial && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3 text-xs">
            <input
              type="text"
              placeholder="Material title (e.g., Stewart Calculus 8th Ed. or Week 4 Slides)"
              value={newMaterialTitle}
              onChange={e => setNewMaterialTitle(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <select
              value={newMaterialType}
              onChange={e => setNewMaterialType(e.target.value as StudyMaterial['type'])}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="textbook">Textbook / Book</option>
              <option value="slides">Lecture Slides</option>
              <option value="notes">Notes / PDF</option>
              <option value="practice_problems">Practice Problems</option>
              <option value="past_paper">Past Paper</option>
              <option value="video">Video Playlist</option>
            </select>
            <input
              type="text"
              placeholder="Pages / Scope (e.g. Ch. 4-6, p. 120-180)"
              value={newMaterialScope}
              onChange={e => setNewMaterialScope(e.target.value)}
              className="w-48 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button
              onClick={handleAddMaterial}
              className="px-3.5 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsAddingMaterial(false)}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Materials list */}
        {!subject.materials || subject.materials.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-850 rounded-lg">
            No specific study materials entered yet. Add textbooks, slides, or problem sets above so the day-by-day study planner knows what resources to assign for each day.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subject.materials.map(mat => (
              <div
                key={mat.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                    <BookOpen className="w-3 h-3" />
                    <span>{mat.type.replace('_', ' ')}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                    {mat.title}
                  </h4>
                  {mat.scopeOrPages && (
                    <span className="text-[11px] text-slate-500 block truncate">
                      {mat.scopeOrPages}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteMaterial(mat.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                  title="Remove material"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topics & Units Section */}
      <div className="space-y-4">
        {/* Controls: Search & Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setTopicFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                topicFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Topics ({stats.totalTopics})
            </button>
            <button
              onClick={() => setTopicFilter('remaining')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                topicFilter === 'remaining'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Remaining ({stats.notStartedTopics + stats.inProgressTopics})
            </button>
            <button
              onClick={() => setTopicFilter('completed')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                topicFilter === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Completed ({stats.completedTopics})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
          </div>
        </div>

        {/* Add Unit Form */}
        {isAddingUnit && (
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-200 dark:border-slate-700 flex items-center gap-3">
            <input
              type="text"
              placeholder="Unit Title (e.g., Unit 4: Memory Paging & Cache Hierarchies)"
              value={newUnitTitle}
              onChange={e => setNewUnitTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
              autoFocus
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddUnit}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Save Unit
            </button>
            <button
              onClick={() => setIsAddingUnit(false)}
              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Units List */}
        {subject.units.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No syllabus units entered yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add your first unit manually or paste your course syllabus schedule to parse topics and track your days left.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsAddingUnit(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Add First Unit
              </button>
              <button
                onClick={() => onOpenSyllabusImport(subject.id)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Paste Syllabus
              </button>
            </div>
          </div>
        ) : (
          subject.units.map(unit => {
            const isCollapsed = collapsedUnits[unit.id];
            
            // Filter topics for this unit
            const visibleTopics = unit.topics.filter(topic => {
              if (topicFilter === 'remaining' && topic.status === 'completed') return false;
              if (topicFilter === 'completed' && topic.status !== 'completed') return false;
              if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
              return true;
            });

            const unitTotal = unit.topics.length;
            const unitCompleted = unit.topics.filter(t => t.status === 'completed').length;
            const unitPercent = unitTotal > 0 ? Math.round((unitCompleted / unitTotal) * 100) : 0;

            return (
              <div
                key={unit.id}
                className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Unit Header */}
                <div
                  className="p-4 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-850/50 cursor-pointer select-none border-b border-slate-100 dark:border-slate-800"
                  onClick={() => toggleUnitCollapse(unit.id)}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {unit.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      <span aria-hidden="true">·</span>
                      <span>{unitCompleted}/{unitTotal} done ({unitPercent}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {unitCompleted < unitTotal && (
                      <button
                        onClick={() => handleMarkAllUnitComplete(unit.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors"
                        title="Mark all topics in unit complete"
                      >
                        Complete All
                      </button>
                    )}

                    <button
                      onClick={() => setActiveUnitForTopic(unit.id)}
                      className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Topic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestDeleteUnit(unit)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                      title="Delete Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Unit Content */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Add topic inline input */}
                    {activeUnitForTopic === unit.id && (
                      <div className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 flex flex-wrap items-center gap-2.5 text-xs">
                        <input
                          type="text"
                          placeholder="Topic title (e.g., Eigenvectors and Diagonalization)"
                          value={newTopicTitle}
                          onChange={e => setNewTopicTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTopic(unit.id)}
                          autoFocus
                          className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500">Hours:</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="20"
                            value={newTopicHours}
                            onChange={e => setNewTopicHours(e.target.value)}
                            className="w-16 px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        <select
                          value={newTopicDifficulty}
                          onChange={e => setNewTopicDifficulty(e.target.value as DifficultyLevel)}
                          className="px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <button
                          onClick={() => handleAddTopic(unit.id)}
                          className="px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setActiveUnitForTopic(null)}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {visibleTopics.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No topics match the current filter in this unit.
                      </div>
                    ) : (
                      visibleTopics.map(topic => {
                        return (
                          <div
                            key={topic.id}
                            className={`p-3.5 flex items-center justify-between gap-3 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                              topic.status === 'completed' ? 'bg-slate-50/30 dark:bg-slate-900/40' : ''
                            }`}
                          >
                            {/* Left: Status toggle + Title */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <button
                                onClick={() => handleUpdateTopicStatus(unit.id, topic.id, topic.status)}
                                title={`Status: ${topic.status.replace('_', ' ')}. Click to cycle.`}
                                className="shrink-0 focus:outline-none transition-transform active:scale-95"
                              >
                                {topic.status === 'completed' ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                ) : topic.status === 'in_progress' ? (
                                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 hover:text-slate-400" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <span
                                  className={`font-medium text-xs md:text-sm block truncate ${
                                    topic.status === 'completed'
                                      ? 'line-through text-slate-400 dark:text-slate-500'
                                      : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {topic.title}
                                </span>
                              </div>
                            </div>

                            {/* Right: metadata (unboxed) + actions */}
                            <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-mono tabular-nums">{topic.estimatedHours}h</span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                              <span
                                className={
                                  topic.difficulty === 'hard'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : topic.difficulty === 'medium'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                }
                              >
                                {topic.difficulty}
                              </span>

                              <button
                                onClick={() => handleDeleteTopic(unit.id, topic.id)}
                                title="Delete topic"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Unit Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(unitToDelete)}
        title="Delete Unit & Topics?"
        message={`Are you sure you want to delete "${unitToDelete?.title}"? All its topics and tracking progress will be permanently removed.`}
        confirmLabel="Delete Unit"
        onConfirm={handleConfirmDeleteUnit}
        onClose={() => setUnitToDelete(null)}
      />

      {/* Subject Deletion Confirmation Modal */}
      {onDeleteSubject && (
        <ConfirmModal
          isOpen={isDeleteSubjectConfirmOpen}
          title={`Delete ${subject.name}?`}
          message={`Are you sure you want to delete this course (${subject.code || subject.name})? All syllabus units, topics, and associated exam deadlines will be deleted.`}
          confirmLabel="Delete Course"
          onConfirm={() => {
            onDeleteSubject(subject.id);
            onBack();
          }}
          onClose={() => setIsDeleteSubjectConfirmOpen(false)}
        />
      )}
    </div>
  );
};
