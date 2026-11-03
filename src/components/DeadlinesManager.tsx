import React, { useState } from 'react';
import { Plus, Filter, Calendar, Award } from 'lucide-react';
import { Assessment, Subject, AssessmentType } from '../types';
import { AssessmentCard } from './AssessmentCard';
import { getTimeRemaining } from '../utils/dateUtils';

interface DeadlinesManagerProps {
  assessments: Assessment[];
  subjects: Subject[];
  onToggleComplete: (id: string) => void;
  onEditAssessment: (assessment: Assessment) => void;
  onDeleteAssessment: (id: string) => void;
  onOpenAddModal: () => void;
}

export const DeadlinesManager: React.FC<DeadlinesManagerProps> = ({
  assessments,
  subjects,
  onToggleComplete,
  onEditAssessment,
  onDeleteAssessment,
  onOpenAddModal,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | AssessmentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'urgent' | 'completed'>('pending');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'weight'>('date');

  const subjectMap = new Map<string, Subject>();
  subjects.forEach(s => subjectMap.set(s.id, s));

  // Filter logic
  const filtered = assessments.filter(item => {
    // Type filter
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;

    // Subject filter
    if (selectedSubjectId !== 'all' && item.subjectId !== selectedSubjectId) return false;

    // Status / Urgency filter
    if (statusFilter === 'pending' && item.isCompleted) return false;
    if (statusFilter === 'completed' && !item.isCompleted) return false;
    if (statusFilter === 'urgent') {
      if (item.isCompleted) return false;
      const rem = getTimeRemaining(item.dueDate);
      if (rem.days > 7 && !rem.isOverdue) return false;
    }

    return true;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'weight') {
      return (b.weightPercentage || 0) - (a.weightPercentage || 0);
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const urgentCount = assessments.filter(a => {
    if (a.isCompleted) return false;
    const r = getTimeRemaining(a.dueDate);
    return r.days <= 7 || r.isOverdue;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
            Exams & Assignment Deadlines
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time countdown to tests, finals, homework, and term projects with desktop notification alerts.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam / Assignment</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pending Deadlines
          </button>
          <button
            onClick={() => setStatusFilter('urgent')}
            className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              statusFilter === 'urgent'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Urgent (≤ 7 Days)</span>
            {urgentCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-mono">
                {urgentCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              statusFilter === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
        </div>

        {/* Dropdowns: Type, Subject & Sort */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as 'all' | AssessmentType)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Assessment Types</option>
              <option value="exam">Exams & Midterms</option>
              <option value="assignment">Assignments & HW</option>
              <option value="quiz">Quizzes</option>
              <option value="project">Projects & Papers</option>
            </select>
          </div>

          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-[160px] truncate"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.code || s.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'weight')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="date">Sort: Earliest Due</option>
            <option value="weight">Sort: Grade Weight</option>
          </select>
        </div>
      </div>

      {/* Deadlines Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No deadlines match your current filter
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up, or no assessments have been logged with this criteria.
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Add New Deadline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <AssessmentCard
              key={item.id}
              assessment={item}
              subject={subjectMap.get(item.subjectId)}
              onToggleComplete={onToggleComplete}
              onEdit={onEditAssessment}
              onDelete={onDeleteAssessment}
            />
          ))}
        </div>
      )}
    </div>
  );
};
