import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCheck,
  AlertCircle,
  Flame,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, Assessment, DayPlan, DailyStudyTask } from '../types';
import { generateDayByDayStudyPlan } from '../utils/studyPlanner';
import { playSuccessChime } from '../utils/audio';

interface DayByDayPlanViewProps {
  subjects: Subject[];
  assessments: Assessment[];
  onUpdateSubject: (updated: Subject) => void;
  onOpenEasyEntry: () => void;
}

export const DayByDayPlanView: React.FC<DayByDayPlanViewProps> = ({
  subjects,
  assessments,
  onUpdateSubject,
  onOpenEasyEntry,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [dailyMaxHours, setDailyMaxHours] = useState<number>(3.5);
  const [reserveRevisionDays, setReserveRevisionDays] = useState<number>(1);
  const [dayFilter, setDayFilter] = useState<'all' | 'upcoming' | 'today' | 'week'>('all');
  const [copiedSchedule, setCopiedSchedule] = useState(false);

  // Generate day-by-day plan
  const dayPlans = useMemo(() => {
    return generateDayByDayStudyPlan(subjects, assessments, {
      dailyMaxHours,
      reserveRevisionDays,
      focusSubjectId: selectedSubjectId,
    });
  }, [subjects, assessments, dailyMaxHours, reserveRevisionDays, selectedSubjectId]);

  // Handle checking/unchecking a study task
  const handleToggleTask = (task: DailyStudyTask) => {
    const sub = subjects.find(s => s.id === task.subjectId);
    if (!sub || !task.topicId) return;

    // Find topic and toggle its status
    let nextStatus: 'completed' | 'in_progress' = 'completed';
    const currentTopic = sub.units.flatMap(u => u.topics).find(t => t.id === task.topicId);
    if (currentTopic && currentTopic.status === 'completed') {
      nextStatus = 'in_progress';
    }

    if (nextStatus === 'completed') {
      playSuccessChime();
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.65 } });
    }

    const updatedUnits = sub.units.map(u => ({
      ...u,
      topics: u.topics.map(t => {
        if (t.id !== task.topicId) return t;
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }),
    }));

    onUpdateSubject({
      ...sub,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
  };

  // Mark all tasks on a specific day as completed
  const handleCompleteEntireDay = (day: DayPlan) => {
    playSuccessChime();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

    // Group tasks by subject
    const subjectTasksMap = new Map<string, string[]>();
    day.tasks.forEach(t => {
      if (t.topicId) {
        const existing = subjectTasksMap.get(t.subjectId) || [];
        existing.push(t.topicId);
        subjectTasksMap.set(t.subjectId, existing);
      }
    });

    subjectTasksMap.forEach((topicIds, subId) => {
      const sub = subjects.find(s => s.id === subId);
      if (!sub) return;

      const updatedUnits = sub.units.map(u => ({
        ...u,
        topics: u.topics.map(t => {
          if (topicIds.includes(t.id)) {
            return {
              ...t,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
            };
          }
          return t;
        }),
      }));

      onUpdateSubject({
        ...sub,
        units: updatedUnits,
        updatedAt: new Date().toISOString(),
      });
    });
  };

  // Filter day plans according to active tab
  const filteredDays = useMemo(() => {
    if (dayFilter === 'today') {
      return dayPlans.filter(d => d.isToday);
    }
    if (dayFilter === 'week') {
      return dayPlans.slice(0, 7);
    }
    if (dayFilter === 'upcoming') {
      return dayPlans.filter(d => !d.isPast);
    }
    return dayPlans;
  }, [dayPlans, dayFilter]);

  // Copy full schedule to clipboard
  const handleCopySchedule = () => {
    const textLines = [
      `📚 STUDY PLAN SCHEDULE (${subjects.length} courses)`,
      `Generated on ${new Date().toLocaleDateString()}`,
      '--------------------------------------------------',
    ];

    dayPlans.slice(0, 14).forEach(d => {
      textLines.push(`\n📅 Day ${d.dayNumber} (${d.dateFormatted})${d.isExamDay ? ' [EXAM DAY]' : ''}:`);
      d.tasks.forEach(t => {
        textLines.push(`  - [${t.subjectCode}] ${t.topicTitle} (${t.estimatedHours}h)`);
        if (t.materialTitle) {
          textLines.push(`    Material: ${t.materialTitle}`);
        }
      });
    });

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 3000);
  };

  const todayPlan = dayPlans.find(d => d.isToday);
  const totalPlannedDays = dayPlans.length;
  const completedDaysCount = dayPlans.filter(d => d.allCompleted).length;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-4 h-4" />
            <span>Day-by-Day Study Schedule</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-display">
            What to Study on Each Day
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Your materials and syllabus topics mapped out calendar day by calendar day, leading up to each exam.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopySchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {copiedSchedule ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSchedule ? 'Copied!' : 'Copy Plan'}</span>
          </button>

          <button
            onClick={onOpenEasyEntry}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add Course & Materials</span>
          </button>
        </div>
      </div>

      {/* Today's Spotlight Widget (if today has tasks) */}
      {todayPlan && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                Today's Target
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {todayPlan.dateFormatted} · Day {todayPlan.dayNumber}
              </span>
              <span className="text-xs text-slate-500">
                ({todayPlan.totalHours} hrs planned)
              </span>
            </div>

            {todayPlan.tasks.length > 0 && !todayPlan.allCompleted && (
              <button
                onClick={() => handleCompleteEntireDay(todayPlan)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All of Today Done</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {todayPlan.tasks.map(task => {
              // Check if topic is complete
              const sub = subjects.find(s => s.id === task.subjectId);
              const currentTopic = sub?.units.flatMap(u => u.topics).find(t => t.id === task.topicId);
              const isDone = currentTopic?.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border bg-white dark:bg-slate-900 transition-all ${
                    isDone
                      ? 'border-emerald-200 dark:border-emerald-900/40 opacity-80'
                      : 'border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {task.subjectCode}
                    </span>
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="shrink-0 text-slate-400 hover:text-emerald-600"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h4 className={`text-xs font-semibold mt-1 line-clamp-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {task.topicTitle}
                  </h4>

                  {task.materialTitle && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 truncate">
                      <BookOpen className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{task.materialTitle}</span>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{task.estimatedHours} hrs</span>
                    <span className={isDone ? 'text-emerald-600 font-semibold' : 'text-indigo-500'}>
                      {isDone ? 'Completed' : 'Study Today'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Pacing Controls Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Day range filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setDayFilter('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              dayFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Days ({dayPlans.length})
          </button>
          <button
            onClick={() => setDayFilter('today')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              dayFilter === 'today'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Today Only
          </button>
          <button
            onClick={() => setDayFilter('week')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              dayFilter === 'week'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Next 7 Days
          </button>
          <button
            onClick={() => setDayFilter('upcoming')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              dayFilter === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Upcoming Days
          </button>
        </div>

        {/* Course Filter Dropdown & Hours slider */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Courses</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code || s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
            <label className="text-slate-500">Daily Cap:</label>
            <div className="flex items-center gap-1">
              {[2.5, 3.5, 5.0].map(h => (
                <button
                  key={h}
                  onClick={() => setDailyMaxHours(h)}
                  className={`px-2 py-0.5 rounded font-mono font-medium ${
                    dailyMaxHours === h
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Day by Day Cards List */}
      <div className="space-y-4">
        {filteredDays.map(day => {
          return (
            <div
              key={day.dayNumber}
              className={`rounded-2xl border transition-all ${
                day.isToday
                  ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 shadow-md ring-1 ring-indigo-200 dark:ring-indigo-800'
                  : day.isExamDay
                  ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/60 shadow-sm'
                  : day.isRevisionDay
                  ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-900/60 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {/* Day Header */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/30 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      day.isToday
                        ? 'bg-indigo-600 text-white'
                        : day.isExamDay
                        ? 'bg-rose-600 text-white'
                        : day.isRevisionDay
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    D{day.dayNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                        {day.dateFormatted}
                      </h3>
                      {day.isToday && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                          Today
                        </span>
                      )}
                      {day.isExamDay && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                          Exam Day
                        </span>
                      )}
                      {day.isRevisionDay && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                          Mock & Revision
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono tabular-nums">
                    {day.totalHours} study hours
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{day.tasks.length} {day.tasks.length === 1 ? 'task' : 'tasks'}</span>

                  {day.tasks.length > 0 && (
                    <button
                      onClick={() => handleCompleteEntireDay(day)}
                      className="ml-2 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-md transition-colors"
                      title="Check off all tasks for this day"
                    >
                      Complete All
                    </button>
                  )}
                </div>
              </div>

              {/* Day Tasks List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {day.tasks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Rest or buffer day. No heavy syllabus topics scheduled.
                  </div>
                ) : (
                  day.tasks.map(task => {
                    const sub = subjects.find(s => s.id === task.subjectId);
                    const currentTopic = sub?.units.flatMap(u => u.topics).find(t => t.id === task.topicId);
                    const isDone = currentTopic?.status === 'completed' || task.isCompleted;

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                          isDone ? 'bg-slate-50/30 dark:bg-slate-900/20' : ''
                        }`}
                      >
                        {/* Task toggle & info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="mt-0.5 shrink-0 focus:outline-none transition-transform active:scale-95"
                            title={isDone ? 'Mark pending' : 'Mark completed'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 hover:text-indigo-600" />
                            )}
                          </button>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {task.subjectCode}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {task.topicTitle}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {task.action}
                            </p>

                            {task.materialTitle && (
                              <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Material: {task.materialTitle}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Task hours */}
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono tabular-nums shrink-0">
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span>{task.estimatedHours}h</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
