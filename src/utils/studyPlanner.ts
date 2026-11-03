import { Subject, Assessment, DayPlan, DailyStudyTask, StudyMaterial } from '../types';
import { getTimeRemaining } from './dateUtils';

interface GeneratePlanOptions {
  dailyMaxHours?: number;
  reserveRevisionDays?: number; // e.g. 1 or 2 days before exam
  startDate?: Date;
  focusSubjectId?: string; // optional: plan for one specific subject or all
}

/**
 * Generate a comprehensive day-by-day study plan from today until exam dates,
 * assigning specific topics and materials to each day.
 */
export function generateDayByDayStudyPlan(
  subjects: Subject[],
  assessments: Assessment[],
  options: GeneratePlanOptions = {}
): DayPlan[] {
  const dailyMaxHours = options.dailyMaxHours || 3.5;
  const reserveRevisionDays = options.reserveRevisionDays ?? 1;
  const start = options.startDate ? new Date(options.startDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const activeSubjects = options.focusSubjectId && options.focusSubjectId !== 'all'
    ? subjects.filter(s => s.id === options.focusSubjectId)
    : subjects;

  if (activeSubjects.length === 0) return [];

  // Find latest target exam date to determine the total schedule span
  let maxTargetTimestamp = start.getTime() + 14 * 86400000; // default at least 14 days
  activeSubjects.forEach(s => {
    const examTime = new Date(s.targetExamDate).getTime();
    if (!isNaN(examTime) && examTime > maxTargetTimestamp) {
      maxTargetTimestamp = examTime;
    }
  });

  assessments.forEach(a => {
    if (!a.isCompleted) {
      const aTime = new Date(a.dueDate).getTime();
      if (!isNaN(aTime) && aTime > maxTargetTimestamp) {
        maxTargetTimestamp = aTime;
      }
    }
  });

  const totalDays = Math.min(60, Math.max(7, Math.ceil((maxTargetTimestamp - start.getTime()) / 86400000) + 1));

  // Build a prioritized queue of remaining topics across subjects
  // Sort subjects by nearest exam deadline first
  const sortedSubjects = [...activeSubjects].sort((a, b) => {
    const timeA = new Date(a.targetExamDate).getTime();
    const timeB = new Date(b.targetExamDate).getTime();
    return timeA - timeB;
  });

  interface PendingTopicItem {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    subjectColor: string;
    topicId: string;
    topicTitle: string;
    estimatedHours: number;
    difficulty: string;
    materialSummary?: string;
    examDate: Date;
    isCompleted: boolean;
    completedAt?: string;
  }

  const topicQueue: PendingTopicItem[] = [];

  sortedSubjects.forEach(sub => {
    const examDate = new Date(sub.targetExamDate);
    const materials = sub.materials || [];

    sub.units.forEach(unit => {
      unit.topics.forEach(t => {
        // Find matching or relevant material
        let matSummary = '';
        if (materials.length > 0) {
          // pick a material that matches or rotate
          const mat = materials.find(m => t.associatedMaterials?.includes(m.id)) || materials[0];
          matSummary = `${mat.title}${mat.scopeOrPages ? ` (${mat.scopeOrPages})` : ''}`;
        }

        topicQueue.push({
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code || 'COURSE',
          subjectColor: sub.color || 'indigo',
          topicId: t.id,
          topicTitle: t.title,
          estimatedHours: t.estimatedHours || 2.0,
          difficulty: t.difficulty,
          materialSummary: matSummary,
          examDate,
          isCompleted: t.status === 'completed',
          completedAt: t.completedAt,
        });
      });
    });
  });

  // Separate completed and remaining topics
  const remainingQueue = topicQueue.filter(t => !t.isCompleted);

  // Map out days
  const dayPlans: DayPlan[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < totalDays; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isPast = dayDate.getTime() < new Date().setHours(0, 0, 0, 0);

    const formatted = dayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Check if any exams or assignments are on this day
    const examsOnDay = assessments.filter(a => {
      const aDateStr = new Date(a.dueDate).toISOString().split('T')[0];
      return aDateStr === dateStr;
    });

    // Check if this day is a subject targetExamDate
    const subjectsExamToday = activeSubjects.filter(s => {
      const sDateStr = new Date(s.targetExamDate).toISOString().split('T')[0];
      return sDateStr === dateStr;
    });

    const isExamDay = examsOnDay.length > 0 || subjectsExamToday.length > 0;
    const examTitles = [
      ...examsOnDay.map(e => `${e.title} (${e.type.toUpperCase()})`),
      ...subjectsExamToday.map(s => `${s.code || s.name} Final Exam`),
    ];

    // Check if this day is 1 day before any exam -> Revision Day
    const isRevisionDay = activeSubjects.some(s => {
      const diff = Math.round((new Date(s.targetExamDate).setHours(0, 0, 0, 0) - dayDate.getTime()) / 86400000);
      return diff <= reserveRevisionDays && diff > 0;
    });

    const tasks: DailyStudyTask[] = [];
    let currentHours = 0;

    if (isExamDay) {
      // Light warmup task or exam sitting
      tasks.push({
        id: `task_exam_${i}`,
        subjectId: subjectsExamToday[0]?.id || examsOnDay[0]?.subjectId || 'exam',
        subjectName: subjectsExamToday[0]?.name || 'Assessment Day',
        subjectCode: subjectsExamToday[0]?.code || 'EXAM',
        subjectColor: 'rose',
        topicTitle: 'EXAM & ASSESSMENT DAY',
        action: `Take ${examTitles.join(' & ')} - Review high-yield summary notes 1 hour before`,
        estimatedHours: 2.0,
        isCompleted: isPast,
      });
      currentHours = 2.0;
    } else if (isRevisionDay) {
      // Dedicated revision day
      const targetSub = activeSubjects.find(s => {
        const diff = Math.round((new Date(s.targetExamDate).setHours(0, 0, 0, 0) - dayDate.getTime()) / 86400000);
        return diff <= reserveRevisionDays && diff > 0;
      });

      if (targetSub) {
        tasks.push({
          id: `task_rev_${i}_1`,
          subjectId: targetSub.id,
          subjectName: targetSub.name,
          subjectCode: targetSub.code || 'COURSE',
          subjectColor: targetSub.color || 'amber',
          topicTitle: `Comprehensive Revision: ${targetSub.code || targetSub.name}`,
          action: 'Solve 1 full timed practice exam & review formula/concept cheat sheets',
          estimatedHours: 2.5,
          isCompleted: isPast,
        });
        tasks.push({
          id: `task_rev_${i}_2`,
          subjectId: targetSub.id,
          subjectName: targetSub.name,
          subjectCode: targetSub.code || 'COURSE',
          subjectColor: targetSub.color || 'amber',
          topicTitle: 'Error Log & High-Yield Weaknesses',
          action: 'Re-attempt tricky practice problems and flashcard drill',
          estimatedHours: 1.5,
          isCompleted: isPast,
        });
        currentHours = 4.0;
      }
    } else {
      // Standard study day: pull topics from queue until dailyMaxHours is satisfied
      while (remainingQueue.length > 0 && currentHours < dailyMaxHours) {
        const nextTopic = remainingQueue.shift()!;
        const duration = Math.min(2.5, nextTopic.estimatedHours);

        let actionText = `Study topic thoroughly`;
        if (nextTopic.materialSummary) {
          actionText = `Read & practice with: ${nextTopic.materialSummary}`;
        } else {
          actionText = `Review chapter notes and solve 5-8 practice questions`;
        }

        tasks.push({
          id: `task_${nextTopic.topicId}_day_${i}`,
          subjectId: nextTopic.subjectId,
          subjectName: nextTopic.subjectName,
          subjectCode: nextTopic.subjectCode,
          subjectColor: nextTopic.subjectColor,
          topicId: nextTopic.topicId,
          topicTitle: nextTopic.topicTitle,
          materialTitle: nextTopic.materialSummary,
          action: actionText,
          estimatedHours: duration,
          isCompleted: false,
        });

        currentHours += duration;
      }

      // If queue is empty, schedule review / flashcard reinforcement
      if (tasks.length === 0 && remainingQueue.length === 0) {
        tasks.push({
          id: `task_maintenance_${i}`,
          subjectId: sortedSubjects[0]?.id || 'sub',
          subjectName: sortedSubjects[0]?.name || 'Active Courses',
          subjectCode: sortedSubjects[0]?.code || 'REVIEW',
          subjectColor: 'emerald',
          topicTitle: 'Syllabus Mastered! Active Recall & Retention',
          action: 'Quick 30-min flashcard spaced repetition or mock question drill',
          estimatedHours: 1.0,
          isCompleted: isPast,
        });
        currentHours = 1.0;
      }
    }

    const allCompleted = tasks.length > 0 && tasks.every(t => t.isCompleted);

    dayPlans.push({
      dayNumber: i + 1,
      date: dateStr,
      dateFormatted: formatted,
      isToday,
      isPast,
      isExamDay,
      isRevisionDay,
      examTitles: examTitles.length > 0 ? examTitles : undefined,
      tasks,
      totalHours: Number(currentHours.toFixed(1)),
      allCompleted,
    });
  }

  return dayPlans;
}
