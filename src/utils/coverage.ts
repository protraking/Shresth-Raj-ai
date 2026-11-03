import { Subject, Assessment } from '../types';
import { getTimeRemaining, calculateVelocity } from './dateUtils';

export interface SubjectCoverageStats {
  subjectId: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  coveragePercentage: number;
  remainingPercentage: number;
  totalEstimatedHours: number;
  completedEstimatedHours: number;
  remainingEstimatedHours: number;
  daysUntilExam: number;
  targetExamDateFormatted: string;
  isOverdue: boolean;
  velocity: {
    topicsPerDay: number;
    hoursPerDay: number;
    isCrunch: boolean;
    isComfortable: boolean;
  };
  urgencyLevel: 'critical' | 'warning' | 'good' | 'mastered';
  nextAssessment?: Assessment;
}

export interface WorkspaceOverviewStats {
  totalSubjects: number;
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  overallCoveragePercentage: number;
  totalRemainingHours: number;
  activeExamsCount: number;
  activeAssignmentsCount: number;
  urgentAssessmentsCount: number;
  criticalSubjectsCount: number;
}

export function calculateSubjectCoverage(
  subject: Subject,
  assessments: Assessment[] = []
): SubjectCoverageStats {
  let totalTopics = 0;
  let completedTopics = 0;
  let inProgressTopics = 0;
  let notStartedTopics = 0;
  let totalEstimatedHours = 0;
  let completedEstimatedHours = 0;

  subject.units.forEach(unit => {
    unit.topics.forEach(t => {
      totalTopics++;
      const hours = t.estimatedHours || 1.5;
      totalEstimatedHours += hours;

      if (t.status === 'completed') {
        completedTopics++;
        completedEstimatedHours += hours;
      } else if (t.status === 'in_progress') {
        inProgressTopics++;
        // count in-progress as half done towards estimated hours
        completedEstimatedHours += hours * 0.4;
      } else {
        notStartedTopics++;
      }
    });
  });

  const remainingTopics = Math.max(0, totalTopics - completedTopics);
  const remainingEstimatedHours = Math.max(0, totalEstimatedHours - completedEstimatedHours);
  
  const coveragePercentage = totalTopics > 0 
    ? Math.round((completedTopics / totalTopics) * 100) 
    : 0;
  const remainingPercentage = Math.max(0, 100 - coveragePercentage);

  // Target exam date calculation
  // Find nearest incomplete exam for this subject or fallback to subject.targetExamDate
  const subjectAssessments = assessments
    .filter(a => a.subjectId === subject.id && !a.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const nearestAssessment = subjectAssessments[0];
  const effectiveTargetDate = nearestAssessment?.dueDate || subject.targetExamDate;

  const timeRem = getTimeRemaining(effectiveTargetDate);
  const daysUntilExam = Math.max(0, timeRem.days);
  const isOverdue = timeRem.isOverdue;

  const velocity = calculateVelocity(remainingTopics, remainingEstimatedHours, daysUntilExam);

  let urgencyLevel: SubjectCoverageStats['urgencyLevel'] = 'good';
  if (coveragePercentage >= 100) {
    urgencyLevel = 'mastered';
  } else if (isOverdue || (daysUntilExam <= 7 && coveragePercentage < 50)) {
    urgencyLevel = 'critical';
  } else if (daysUntilExam <= 14 && coveragePercentage < 70) {
    urgencyLevel = 'warning';
  }

  return {
    subjectId: subject.id,
    totalTopics,
    completedTopics,
    inProgressTopics,
    notStartedTopics,
    coveragePercentage,
    remainingPercentage,
    totalEstimatedHours: Number(totalEstimatedHours.toFixed(1)),
    completedEstimatedHours: Number(completedEstimatedHours.toFixed(1)),
    remainingEstimatedHours: Number(remainingEstimatedHours.toFixed(1)),
    daysUntilExam,
    targetExamDateFormatted: effectiveTargetDate,
    isOverdue,
    velocity,
    urgencyLevel,
    nextAssessment: nearestAssessment,
  };
}

export function calculateWorkspaceOverview(
  subjects: Subject[],
  assessments: Assessment[]
): WorkspaceOverviewStats {
  let totalTopics = 0;
  let completedTopics = 0;
  let totalRemainingHours = 0;
  let criticalSubjectsCount = 0;

  subjects.forEach(sub => {
    const stats = calculateSubjectCoverage(sub, assessments);
    totalTopics += stats.totalTopics;
    completedTopics += stats.completedTopics;
    totalRemainingHours += stats.remainingEstimatedHours;
    if (stats.urgencyLevel === 'critical') {
      criticalSubjectsCount++;
    }
  });

  const remainingTopics = Math.max(0, totalTopics - completedTopics);
  const overallCoveragePercentage = totalTopics > 0 
    ? Math.round((completedTopics / totalTopics) * 100) 
    : 0;

  const activeAssessments = assessments.filter(a => !a.isCompleted);
  const activeExamsCount = activeAssessments.filter(a => a.type === 'exam' || a.type === 'quiz').length;
  const activeAssignmentsCount = activeAssessments.filter(a => a.type === 'assignment' || a.type === 'project').length;
  
  const urgentAssessmentsCount = activeAssessments.filter(a => {
    const rem = getTimeRemaining(a.dueDate);
    return !rem.isOverdue && rem.days <= 7;
  }).length;

  return {
    totalSubjects: subjects.length,
    totalTopics,
    completedTopics,
    remainingTopics,
    overallCoveragePercentage,
    totalRemainingHours: Number(totalRemainingHours.toFixed(1)),
    activeExamsCount,
    activeAssignmentsCount,
    urgentAssessmentsCount,
    criticalSubjectsCount,
  };
}
