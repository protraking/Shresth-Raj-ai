import React from 'react';
import { Calendar, ChevronRight, Clock, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { Subject, Assessment } from '../types';
import { CoverageBar } from './CoverageBar';
import { calculateSubjectCoverage } from '../utils/coverage';
import { formatPrettyDate, getTimeRemaining } from '../utils/dateUtils';

interface SubjectCardProps {
  subject: Subject;
  assessments: Assessment[];
  onSelect: (subjectId: string) => void;
  onDelete: (subjectId: string) => void;
  onEditExamDate: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  assessments,
  onSelect,
  onDelete,
  onEditExamDate,
}) => {
  const stats = calculateSubjectCoverage(subject, assessments);
  const time = getTimeRemaining(subject.targetExamDate);

  const colorPillStyles: Record<string, string> = {
    indigo: 'text-indigo-700 dark:text-indigo-400',
    emerald: 'text-emerald-700 dark:text-emerald-400',
    rose: 'text-rose-700 dark:text-rose-400',
    amber: 'text-amber-700 dark:text-amber-400',
    sky: 'text-sky-700 dark:text-sky-400',
    violet: 'text-violet-700 dark:text-violet-400',
    teal: 'text-teal-700 dark:text-teal-400',
  };

  const accentColor = colorPillStyles[subject.color] || colorPillStyles.indigo;

  return (
    <div
      onClick={() => onSelect(subject.id)}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Header: Code, Credits, and Delete/Edit buttons */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={`font-bold ${accentColor}`}>
              {subject.code || 'COURSE'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              {subject.credits || 3} Credits
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              {subject.units.length} Units
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onEditExamDate(subject);
              }}
              title="Adjust Target Exam Date / Days Left"
              aria-label="Edit Exam Date"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onDelete(subject.id);
              }}
              title="Delete Subject"
              aria-label="Delete Subject"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {subject.name}
        </h3>

        {/* Days Left and Exam Countdown Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Exam: {formatPrettyDate(subject.targetExamDate).split(',')[0]}</span>
          </div>

          <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-900 dark:text-white tabular-nums">
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              {time.isOverdue
                ? `Overdue by ${Math.abs(time.days)}d`
                : `${stats.daysUntilExam} Days Left`}
            </span>
          </div>
        </div>

        {/* Coverage Progress Bar */}
        <div className="mt-4">
          <CoverageBar
            completedPercentage={stats.coveragePercentage}
            inProgressPercentage={Math.round((stats.inProgressTopics / Math.max(1, stats.totalTopics)) * 100)}
            color={subject.color}
            size="md"
            totalTopics={stats.totalTopics}
            completedTopics={stats.completedTopics}
            remainingTopics={stats.notStartedTopics + stats.inProgressTopics}
          />
        </div>

        {/* Coverage Remaining breakdown callout */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Syllabus Coverage:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {stats.completedTopics}/{stats.totalTopics} topics complete
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Remaining:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              {stats.remainingPercentage}% left
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Required daily pace */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Need <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{stats.velocity.topicsPerDay}</strong> topics/day
        </span>
        <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
          Open Syllabus <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
