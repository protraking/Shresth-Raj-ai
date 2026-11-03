import React, { useState } from 'react';
import { Target, Calendar, CheckCircle2, Circle, Clock, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, Topic, Assessment } from '../types';
import { calculateSubjectCoverage } from '../utils/coverage';
import { playSuccessChime } from '../utils/audio';

interface StudyPacingPlannerProps {
  subjects: Subject[];
  assessments: Assessment[];
  onUpdateSubject: (subject: Subject) => void;
  onNavigateToSubject: (subjectId: string) => void;
}

export const StudyPacingPlanner: React.FC<StudyPacingPlannerProps> = ({
  subjects,
  assessments,
  onUpdateSubject,
  onNavigateToSubject,
}) => {
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState<number>(6); // 5, 6, or 7 days
  const [dailyMaxHours, setDailyMaxHours] = useState<number>(4);

  // Compute coverage stats for each subject
  const subjectStats = subjects.map(s => ({
    subject: s,
    stats: calculateSubjectCoverage(s, assessments),
  }));

  // Identify next uncompleted topics for each subject (up to 2 per subject for today's agenda)
  const todayAgendaItems: Array<{
    subject: Subject;
    unitId: string;
    unitTitle: string;
    topic: Topic;
    daysUntilExam: number;
  }> = [];

  subjects.forEach(sub => {
    const stats = calculateSubjectCoverage(sub, assessments);
    let count = 0;
    for (const unit of sub.units) {
      for (const topic of unit.topics) {
        if (topic.status !== 'completed' && count < 2) {
          todayAgendaItems.push({
            subject: sub,
            unitId: unit.id,
            unitTitle: unit.title,
            topic,
            daysUntilExam: stats.daysUntilExam,
          });
          count++;
        }
      }
    }
  });

  // Sort agenda by urgency (nearest exam first)
  todayAgendaItems.sort((a, b) => a.daysUntilExam - b.daysUntilExam);

  const handleToggleTopic = (subjectId: string, unitId: string, topicId: string, currentStatus: string) => {
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;

    const nextStatus: Topic['status'] = currentStatus === 'completed' ? 'not_started' : 'completed';
    if (nextStatus === 'completed') {
      playSuccessChime();
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    }

    const updatedUnits = sub.units.map(u => {
      if (u.id !== unitId) return u;
      return {
        ...u,
        topics: u.topics.map(t => {
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
      ...sub,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
  };

  const totalRemainingTopics = subjectStats.reduce((acc, curr) => acc + (curr.stats.notStartedTopics + curr.stats.inProgressTopics), 0);
  const totalRemainingHours = subjectStats.reduce((acc, curr) => acc + curr.stats.remainingEstimatedHours, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Target className="w-4 h-4" />
            <span>Pacing & Target Calculator</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-display">
            Daily Study Pacing & Syllabus Coverage Planner
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Calculates how many topics and hours you must complete every day based on the remaining days until each exam.
          </p>
        </div>

        {/* Study rhythm toggles */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <label className="text-[11px] text-slate-500 block">Study Days / Week:</label>
            <div className="flex items-center gap-1 mt-0.5">
              {[5, 6, 7].map(d => (
                <button
                  key={d}
                  onClick={() => setStudyDaysPerWeek(d)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    studyDaysPerWeek === d
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
            <label className="text-[11px] text-slate-500 block">Daily Target Cap:</label>
            <div className="flex items-center gap-1 mt-0.5">
              {[3, 4, 6].map(h => (
                <button
                  key={h}
                  onClick={() => setDailyMaxHours(h)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    dailyMaxHours === h
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Pacing Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjectStats.map(({ subject, stats }) => {
          // Adjust velocity for studyDaysPerWeek ratio
          const dayFactor = 7 / studyDaysPerWeek;
          const adjustedTopicsPerDay = Number((stats.velocity.topicsPerDay * dayFactor).toFixed(1));
          const adjustedHoursPerDay = Number((stats.velocity.hoursPerDay * dayFactor).toFixed(1));

          return (
            <div
              key={subject.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{subject.code || 'COURSE'}</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {stats.daysUntilExam} Days Left
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white text-base mt-1 line-clamp-1">
                  {subject.name}
                </h3>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1 text-slate-600 dark:text-slate-400">
                    <span>{stats.coveragePercentage}% Covered</span>
                    <span className="font-mono tabular-nums font-medium text-slate-500">
                      {stats.remainingPercentage}% left
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${stats.coveragePercentage}%` }}
                    />
                  </div>
                </div>

                {/* Required Rate */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                    Required Daily Rate
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold font-mono tabular-nums ${stats.velocity.isCrunch ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                      {adjustedTopicsPerDay}
                    </span>
                    <span className="text-xs text-slate-500">topics / study day</span>
                  </div>
                  <span className="text-xs text-slate-400 block font-mono">
                    ≈ {adjustedHoursPerDay} hrs / study day
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {stats.notStartedTopics + stats.inProgressTopics} topics left
                </span>
                <button
                  onClick={() => onNavigateToSubject(subject.id)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Syllabus →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Today's Study Queue */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Recommended Focus Topics for Today
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Prioritized by earliest exam deadline
          </span>
        </div>

        {todayAgendaItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              All syllabi are 100% completed!
            </p>
            <p>You have covered all registered topics across all courses.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayAgendaItems.slice(0, 6).map(item => (
              <div
                key={`${item.subject.id}_${item.topic.id}`}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleTopic(item.subject.id, item.unitId, item.topic.id, item.topic.status)}
                    className="shrink-0 focus:outline-none"
                    title="Mark topic completed"
                  >
                    {item.topic.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 hover:text-indigo-600" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {item.subject.code || item.subject.name}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {item.unitTitle}
                      </span>
                    </div>
                    <span className="font-medium text-sm text-slate-900 dark:text-white block truncate">
                      {item.topic.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    <span>{item.topic.estimatedHours}h</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-medium">
                    Exam in {item.daysUntilExam}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
