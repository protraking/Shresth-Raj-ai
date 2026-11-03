import React from 'react';
import { Calendar, Check, BookOpen, Trash2, Edit3, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Assessment, Subject } from '../types';
import { CountdownBadge } from './CountdownBadge';
import { formatPrettyDate, getTimeRemaining } from '../utils/dateUtils';
import { playSuccessChime } from '../utils/audio';

interface AssessmentCardProps {
  assessment: Assessment;
  subject?: Subject;
  onToggleComplete: (id: string) => void;
  onEdit: (assessment: Assessment) => void;
  onDelete: (id: string) => void;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  subject,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const time = getTimeRemaining(assessment.dueDate);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!assessment.isCompleted) {
      playSuccessChime();
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.6 },
      });
    }
    onToggleComplete(assessment.id);
  };

  const typeLabels: Record<string, string> = {
    exam: 'Exam',
    assignment: 'Assignment',
    quiz: 'Quiz',
    project: 'Project',
    presentation: 'Presentation',
  };

  const typeColors: Record<string, string> = {
    exam: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    assignment: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    quiz: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
    project: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/50',
    presentation: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/50',
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        assessment.isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
          : time.isOverdue
          ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/50 shadow-sm'
          : time.days <= 3
          ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left header: Type + Subject */}
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 font-semibold rounded text-[11px] border ${typeColors[assessment.type] || typeColors.exam}`}>
            {typeLabels[assessment.type] || assessment.type}
          </span>
          {subject && (
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {subject.code ? `${subject.code} · ` : ''}{subject.name}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(assessment)}
            title="Edit Assessment"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(assessment.id)}
            title="Delete Assessment"
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className={`mt-2 font-semibold text-slate-900 dark:text-white text-base ${assessment.isCompleted ? 'line-through text-slate-500 dark:text-slate-500' : ''}`}>
        {assessment.title}
      </h3>

      {/* Scope if available */}
      {assessment.syllabusScope && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className="truncate">Scope: {assessment.syllabusScope}</span>
        </div>
      )}

      {/* Date & Countdown Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span>{formatPrettyDate(assessment.dueDate)}</span>
            {assessment.weightPercentage > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  <Award className="w-3 h-3 text-amber-500" />
                  {assessment.weightPercentage}% weight
                </span>
              </>
            )}
          </div>
          <div>
            <CountdownBadge targetDate={assessment.dueDate} isCompleted={assessment.isCompleted} showSeconds={time.days <= 1} />
          </div>
        </div>

        {/* Complete Toggle Button */}
        <button
          onClick={handleComplete}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            assessment.isCompleted
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>{assessment.isCompleted ? 'Mark Pending' : 'Mark Completed'}</span>
        </button>
      </div>
    </div>
  );
};
