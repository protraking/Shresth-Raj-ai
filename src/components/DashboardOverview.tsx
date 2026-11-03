import React from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Flame,
  Sparkles,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
  Bell,
  Target,
  Trash2,
} from 'lucide-react';
import { Subject, Assessment, NotificationSettings } from '../types';
import { SubjectCard } from './SubjectCard';
import { AssessmentCard } from './AssessmentCard';
import { calculateWorkspaceOverview } from '../utils/coverage';
import { getTimeRemaining } from '../utils/dateUtils';

interface DashboardOverviewProps {
  subjects: Subject[];
  assessments: Assessment[];
  onSelectSubject: (subjectId: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onEditExamDate: (subject: Subject) => void;
  onToggleCompleteAssessment: (id: string) => void;
  onEditAssessment: (assessment: Assessment) => void;
  onDeleteAssessment: (id: string) => void;
  onOpenAddSubject: () => void;
  onOpenAddAssessment: () => void;
  onOpenSyllabusImport: () => void;
  onOpenNotificationModal: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDemoData: () => void;
  onClearAllSubjects?: () => void;
  onOpenEasyEntry: () => void;
  onNavigateToDayPlan: () => void;
  notificationSettings: NotificationSettings;
  notificationPermission: NotificationPermission;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  subjects,
  assessments,
  onSelectSubject,
  onDeleteSubject,
  onEditExamDate,
  onToggleCompleteAssessment,
  onEditAssessment,
  onDeleteAssessment,
  onOpenAddSubject,
  onOpenAddAssessment,
  onOpenSyllabusImport,
  onOpenNotificationModal,
  onExportData,
  onImportData,
  onResetDemoData,
  onClearAllSubjects,
  onOpenEasyEntry,
  onNavigateToDayPlan,
  notificationSettings,
  notificationPermission,
}) => {
  const overview = calculateWorkspaceOverview(subjects, assessments);
  const subjectMap = new Map<string, Subject>();
  subjects.forEach(s => subjectMap.set(s.id, s));

  // Find nearest upcoming incomplete assessments (up to 3 for the dashboard ticker)
  const upcomingAssessments = assessments
    .filter(a => !a.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Overall remaining percentage
  const overallRemainingPercentage = Math.max(0, 100 - overview.overallCoveragePercentage);

  return (
    <div className="space-y-8">
      {/* Quick Easy Entry & Day Plan Spotlight Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Simplified Study Planner
            </span>
            <span className="text-xs text-indigo-200">
              {subjects.length} courses enrolled · All days planned
            </span>
          </div>
          <h2 className="text-lg font-bold font-display text-white">
            Want to know exactly what to study on each day?
          </h2>
          <p className="text-xs text-indigo-200/90 max-w-xl">
            Enter your study materials (textbooks, slides, past papers) and days left — we calculate a day-by-day plan with daily topic checklists!
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToDayPlan}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>View Day-by-Day Plan</span>
          </button>

          <button
            onClick={onOpenEasyEntry}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Quick Add Course & Materials</span>
          </button>
        </div>
      </div>

      {/* Hero / KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Upcoming Deadlines */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Deadlines</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {overview.activeExamsCount + overview.activeAssignmentsCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {overview.activeExamsCount} Exams
              </span>
              <span aria-hidden="true">·</span>
              <span>{overview.activeAssignmentsCount} Assignments</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            {overview.urgentAssessmentsCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ {overview.urgentAssessmentsCount} due in &le; 7 days
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ No immediate crunches
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Overall Syllabus Coverage */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Curriculum Covered</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {overview.overallCoveragePercentage}%
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {overview.completedTopics} of {overview.totalTopics}
              </span>
              <span aria-hidden="true">·</span>
              <span>{overallRemainingPercentage}% remaining</span>
            </div>
          </div>
          {/* Dual track progress */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${overview.overallCoveragePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Remaining Topics */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Syllabus Remaining</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {overview.remainingTopics}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>topics left to cover across {subjects.length} subjects</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {overview.totalRemainingHours} hours
            </span>{' '}
            total estimated study time
          </div>
        </div>

        {/* Metric 4: Desktop Notification Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Desktop Alerts</span>
            <Bell className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                {notificationPermission === 'granted'
                  ? 'System Active'
                  : notificationPermission === 'denied'
                  ? 'Alerts Blocked'
                  : 'Pending Setup'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {notificationPermission === 'granted'
                ? 'Monitors 7d, 3d, 1d & due day timers'
                : 'Click to enable desktop countdown banners'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={onOpenNotificationModal}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Configure Notifications →
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Exams & Assignments Countdown Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Upcoming Exams & Assignments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live countdown timers until each submission or examination.
            </p>
          </div>

          <button
            onClick={onOpenAddAssessment}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exam / Assignment</span>
          </button>
        </div>

        {upcomingAssessments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
            <p>No active exams or assignments on your schedule.</p>
            <button
              onClick={onOpenAddAssessment}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              + Add your first upcoming exam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAssessments.map(item => (
              <AssessmentCard
                key={item.id}
                assessment={item}
                subject={subjectMap.get(item.subjectId)}
                onToggleComplete={onToggleCompleteAssessment}
                onEdit={onEditAssessment}
                onDelete={onDeleteAssessment}
              />
            ))}
          </div>
        )}
      </div>

      {/* Subject Syllabus Coverage Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Subject Syllabus Coverage
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track percentage remaining, completed topics, and required study rate for every course.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSyllabusImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Import Syllabus</span>
            </button>

            <button
              onClick={onOpenAddSubject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Subject</span>
            </button>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No subjects in your study plan yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your courses and their exam target dates to begin monitoring syllabus progress and desktop notifications.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenAddSubject}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Add Subject
              </button>
              <button
                onClick={onResetDemoData}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {subjects.map(sub => (
              <SubjectCard
                key={sub.id}
                subject={sub}
                assessments={assessments}
                onSelect={onSelectSubject}
                onDelete={onDeleteSubject}
                onEditExamDate={onEditExamDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Workspace Utilities & Backup */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900 dark:text-white block">
            Desktop Data Storage & Portability
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            All your syllabus topics and countdowns persist locally in your browser storage.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            title="Download JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>

          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
            title="Reload realistic sample syllabus and countdowns"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          {onClearAllSubjects && subjects.length > 0 && (
            <button
              onClick={onClearAllSubjects}
              className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              title="Remove all subjects and exam countdowns"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Subjects</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
