import React, { useState, useEffect, useCallback } from 'react';
import { Subject, Assessment, NotificationSettings, Unit } from './types';
import { getInitialDemoData, DEFAULT_NOTIFICATION_SETTINGS } from './utils/mockData';
import {
  isNotificationSupported,
  getNotificationPermission,
  checkUpcomingDeadlinesAndNotify,
} from './utils/notifications';
import { getTimeRemaining } from './utils/dateUtils';
import { TopNav } from './components/TopNav';
import { DashboardOverview } from './components/DashboardOverview';
import { SubjectDetailView } from './components/SubjectDetailView';
import { DeadlinesManager } from './components/DeadlinesManager';
import { StudyPacingPlanner } from './components/StudyPacingPlanner';
import { DayByDayPlanView } from './components/DayByDayPlanView';
import { EasyEntryModal } from './components/EasyEntryModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { AddSubjectModal } from './components/AddSubjectModal';
import { AddAssessmentModal } from './components/AddAssessmentModal';
import { SyllabusImportModal } from './components/SyllabusImportModal';
import { SwiftAssistantModal } from './components/SwiftAssistantModal';
import { SwiftFloatingDock } from './components/SwiftFloatingDock';
import { SubjectCard } from './components/SubjectCard';
import { ConfirmModal } from './components/ConfirmModal';
import { Plus, Sparkles, BookOpen, Trash2 } from 'lucide-react';

const STORAGE_KEY_SUBJECTS = 'syllabusdesk_subjects_v1';
const STORAGE_KEY_ASSESSMENTS = 'syllabusdesk_assessments_v1';
const STORAGE_KEY_SETTINGS = 'syllabusdesk_settings_v1';
const STORAGE_KEY_THEME = 'syllabusdesk_theme_v1';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  // Core Data States
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved subjects:', e);
    }
    return getInitialDemoData().subjects;
  });

  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSESSMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved assessments:', e);
    }
    return getInitialDemoData().assessments;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse settings:', e);
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return getNotificationPermission();
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'dayplan' | 'subjects' | 'deadlines' | 'planner' | 'notifications'>('overview');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Modals State
  const [isEasyEntryOpen, setIsEasyEntryOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [isSyllabusImportOpen, setIsSyllabusImportOpen] = useState(false);
  const [importTargetSubjectId, setImportTargetSubjectId] = useState<string | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSwiftOpen, setIsSwiftOpen] = useState(false);

  // In-app deletion and reset confirmation states
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isClearAllSubjectsOpen, setIsClearAllSubjectsOpen] = useState(false);
  const [isResetDemoOpen, setIsResetDemoOpen] = useState(false);

  // Persist data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.error('Error saving subjects:', e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(assessments));
    } catch (e) {
      console.error('Error saving assessments:', e);
    }
  }, [assessments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(notificationSettings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }, [notificationSettings]);

  // Periodic deadline notification checks
  const runNotificationCheck = useCallback(() => {
    if (isNotificationSupported()) {
      setNotificationPermission(Notification.permission);
    }
    checkUpcomingDeadlinesAndNotify(assessments, subjects, notificationSettings);
  }, [assessments, subjects, notificationSettings]);

  useEffect(() => {
    // Run on mount
    runNotificationCheck();

    // Check every 30 seconds
    const interval = setInterval(runNotificationCheck, 30000);
    return () => clearInterval(interval);
  }, [runNotificationCheck]);

  // Dynamic Browser Tab title with urgent badge
  const urgentCount = assessments.filter(a => {
    if (a.isCompleted) return false;
    const r = getTimeRemaining(a.dueDate);
    return r.days <= 3 || r.isOverdue;
  }).length;

  useEffect(() => {
    if (urgentCount > 0) {
      document.title = `(${urgentCount}) SyllabusDesk - Exam Deadlines`;
    } else {
      document.title = 'SyllabusDesk - Exam & Coverage Planner';
    }
  }, [urgentCount]);

  // Handlers for Subjects
  const handleAddSubject = (newSubject: Subject, openImportImmediately = false) => {
    setSubjects(prev => [newSubject, ...prev]);
    if (openImportImmediately) {
      setImportTargetSubjectId(newSubject.id);
      setIsSyllabusImportOpen(true);
    } else {
      setSelectedSubjectId(newSubject.id);
    }
  };

  const handleUpdateSubject = (updated: Subject) => {
    setSubjects(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  // Handlers for subject deletion and clearing
  const handleRequestDeleteSubject = (subjectId: string) => {
    const sub = subjects.find(s => s.id === subjectId);
    if (sub) {
      setSubjectToDelete(sub);
    }
  };

  const handleConfirmDeleteSubject = () => {
    if (!subjectToDelete) return;
    const targetId = subjectToDelete.id;
    setSubjects(prev => prev.filter(s => s.id !== targetId));
    setAssessments(prev => prev.filter(a => a.subjectId !== targetId));
    if (selectedSubjectId === targetId) {
      setSelectedSubjectId(null);
    }
    setSubjectToDelete(null);
  };

  const handleConfirmClearAllSubjects = () => {
    setSubjects([]);
    setAssessments([]);
    setSelectedSubjectId(null);
    setIsClearAllSubjectsOpen(false);
  };

  const handleConfirmResetDemo = () => {
    const demo = getInitialDemoData();
    setSubjects(demo.subjects);
    setAssessments(demo.assessments);
    setSelectedSubjectId(null);
    setIsResetDemoOpen(false);
  };

  // Handlers for Assessments
  const handleSaveAssessment = (assessment: Assessment) => {
    setAssessments(prev => {
      const exists = prev.some(a => a.id === assessment.id);
      if (exists) {
        return prev.map(a => (a.id === assessment.id ? assessment : a));
      }
      return [assessment, ...prev];
    });
  };

  const handleToggleCompleteAssessment = (id: string) => {
    setAssessments(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const nextState = !a.isCompleted;
        return {
          ...a,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  const handleDeleteAssessment = (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setIsAddAssessmentOpen(true);
  };

  // Import handler
  const handleImportComplete = (
    subjectId: string,
    importedUnits: Unit[],
    newAssessments: Assessment[] = [],
    newSubjectMeta?: { name: string; code: string }
  ) => {
    let effectiveSubjectId = subjectId;

    if (subjectId === 'new' && newSubjectMeta) {
      const newSubject: Subject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newSubjectMeta.name,
        code: newSubjectMeta.code,
        color: 'indigo',
        targetExamDate: new Date(Date.now() + 18 * 86400000).toISOString(),
        units: importedUnits,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSubjects(prev => [newSubject, ...prev]);
      effectiveSubjectId = newSubject.id;
    } else {
      // Append to existing subject
      setSubjects(prev =>
        prev.map(s => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            units: [...s.units, ...importedUnits],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }

    // Add detected assessments
    if (newAssessments.length > 0) {
      const fixedAssessments = newAssessments.map(a => ({
        ...a,
        subjectId: effectiveSubjectId,
      }));
      setAssessments(prev => [...fixedAssessments, ...prev]);
    }

    setSelectedSubjectId(effectiveSubjectId);
    setActiveTab('subjects');
  };

  // Data Export & Import
  const handleExportData = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      subjects,
      assessments,
      notificationSettings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SyllabusDesk_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.subjects && Array.isArray(parsed.subjects)) {
          setSubjects(parsed.subjects);
        }
        if (parsed.assessments && Array.isArray(parsed.assessments)) {
          setAssessments(parsed.assessments);
        }
        if (parsed.notificationSettings) {
          setNotificationSettings(parsed.notificationSettings);
        }
        console.log('Data successfully imported!');
      } catch (err) {
        console.error('Invalid JSON file format:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemoData = () => {
    setIsResetDemoOpen(true);
  };

  // Currently viewed subject object
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          if (tab === 'notifications') {
            setIsNotificationModalOpen(true);
          }
        }}
        onOpenEasyAddModal={() => setIsEasyEntryOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenSwift={() => setIsSwiftOpen(true)}
        isDark={isDark}
        toggleDark={toggleDark}
        notificationSettings={notificationSettings}
        toggleSound={() =>
          setNotificationSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        notificationPermission={notificationPermission}
        urgentCount={urgentCount}
      />

      {/* Main Desktop Container (1440px baseline with generous breathing room) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Router */}
        {activeTab === 'overview' && (
          <DashboardOverview
            subjects={subjects}
            assessments={assessments}
            onSelectSubject={id => {
              setSelectedSubjectId(id);
              setActiveTab('subjects');
            }}
            onDeleteSubject={handleRequestDeleteSubject}
            onEditExamDate={s => {
              setSelectedSubjectId(s.id);
              setActiveTab('subjects');
            }}
            onToggleCompleteAssessment={handleToggleCompleteAssessment}
            onEditAssessment={handleEditAssessment}
            onDeleteAssessment={handleDeleteAssessment}
            onOpenAddSubject={() => setIsAddSubjectOpen(true)}
            onOpenAddAssessment={() => {
              setEditingAssessment(null);
              setIsAddAssessmentOpen(true);
            }}
            onOpenSyllabusImport={() => {
              setImportTargetSubjectId(null);
              setIsSyllabusImportOpen(true);
            }}
            onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetDemoData={handleResetDemoData}
            onClearAllSubjects={() => setIsClearAllSubjectsOpen(true)}
            onOpenEasyEntry={() => setIsEasyEntryOpen(true)}
            onNavigateToDayPlan={() => setActiveTab('dayplan')}
            notificationSettings={notificationSettings}
            notificationPermission={notificationPermission}
          />
        )}

        {activeTab === 'dayplan' && (
          <DayByDayPlanView
            subjects={subjects}
            assessments={assessments}
            onUpdateSubject={handleUpdateSubject}
            onOpenEasyEntry={() => setIsEasyEntryOpen(true)}
          />
        )}

        {activeTab === 'subjects' && (
          <div>
            {currentSubject ? (
              <SubjectDetailView
                subject={currentSubject}
                onUpdateSubject={handleUpdateSubject}
                onDeleteSubject={handleRequestDeleteSubject}
                onBack={() => setSelectedSubjectId(null)}
                onOpenSyllabusImport={subId => {
                  setImportTargetSubjectId(subId);
                  setIsSyllabusImportOpen(true);
                }}
              />
            ) : (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      Syllabus Breakdown & Subject Coverage
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Select any course below to manage its units, check off completed topics, and adjust your target exam days.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEasyEntryOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Easy Add Course & Materials</span>
                    </button>

                    <button
                      onClick={() => {
                        setImportTargetSubjectId(null);
                        setIsSyllabusImportOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Paste Raw Syllabus</span>
                    </button>

                    {subjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsClearAllSubjectsOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                        title="Remove all subjects and exams"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove All Subjects</span>
                      </button>
                    )}
                  </div>
                </div>

                {subjects.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        No subjects in your workspace
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Your workspace is clear. Add your first course to begin tracking syllabus topics and exam countdowns.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setIsEasyEntryOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Add Your First Course</span>
                      </button>
                      <button
                        onClick={handleConfirmResetDemo}
                        className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                      >
                        Load Sample Subjects
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
                        onSelect={id => setSelectedSubjectId(id)}
                        onDelete={handleRequestDeleteSubject}
                        onEditExamDate={s => setSelectedSubjectId(s.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'deadlines' && (
          <DeadlinesManager
            assessments={assessments}
            subjects={subjects}
            onToggleComplete={handleToggleCompleteAssessment}
            onEditAssessment={handleEditAssessment}
            onDeleteAssessment={handleDeleteAssessment}
            onOpenAddModal={() => {
              setEditingAssessment(null);
              setIsAddAssessmentOpen(true);
            }}
          />
        )}

        {activeTab === 'planner' && (
          <StudyPacingPlanner
            subjects={subjects}
            assessments={assessments}
            onUpdateSubject={handleUpdateSubject}
            onNavigateToSubject={subId => {
              setSelectedSubjectId(subId);
              setActiveTab('subjects');
            }}
          />
        )}

        {activeTab === 'notifications' && (
          <div className="p-12 text-center text-xs text-slate-500">
            Opening notification settings...
          </div>
        )}
      </main>

      {/* Easy simplified entry modal */}
      <EasyEntryModal
        isOpen={isEasyEntryOpen}
        onClose={() => setIsEasyEntryOpen(false)}
        onSaveComplete={newSubject => {
          setSubjects(prev => [newSubject, ...prev]);
          setSelectedSubjectId(newSubject.id);
          setActiveTab('dayplan');
        }}
      />

      {/* Standard Modals */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onAddSubject={handleAddSubject}
      />

      <AddAssessmentModal
        isOpen={isAddAssessmentOpen}
        onClose={() => {
          setIsAddAssessmentOpen(false);
          setEditingAssessment(null);
        }}
        onSaveAssessment={handleSaveAssessment}
        subjects={subjects}
        initialAssessment={editingAssessment}
      />

      <SyllabusImportModal
        isOpen={isSyllabusImportOpen}
        onClose={() => setIsSyllabusImportOpen(false)}
        subjects={subjects}
        targetSubjectId={importTargetSubjectId}
        onImportComplete={handleImportComplete}
      />

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => {
          setIsNotificationModalOpen(false);
          if (activeTab === 'notifications') {
            setActiveTab('overview');
          }
        }}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        permission={notificationPermission}
        onPermissionChange={setNotificationPermission}
      />

      {/* Floating Side Option to Launch Swift AI Cockpit */}
      <SwiftFloatingDock
        onClick={() => setIsSwiftOpen(true)}
        isOpen={isSwiftOpen}
      />

      {/* Swift Hologram AI Cockpit Modal */}
      <SwiftAssistantModal
        isOpen={isSwiftOpen}
        onClose={() => setIsSwiftOpen(false)}
        subjects={subjects}
        assessments={assessments}
      />

      {/* Single Subject Deletion Confirmation */}
      <ConfirmModal
        isOpen={Boolean(subjectToDelete)}
        title={`Delete ${subjectToDelete?.name || 'Subject'}?`}
        message={`Are you sure you want to delete "${subjectToDelete?.name}"? Its syllabus units, topics, and associated exam deadlines will be permanently removed.`}
        confirmLabel="Delete Subject"
        onConfirm={handleConfirmDeleteSubject}
        onClose={() => setSubjectToDelete(null)}
      />

      {/* Clear All Subjects Confirmation */}
      <ConfirmModal
        isOpen={isClearAllSubjectsOpen}
        title="Remove All Subjects?"
        message={`Are you sure you want to remove all ${subjects.length} subjects from your workspace? All syllabus checklists and countdown timers will be wiped clean.`}
        confirmLabel="Remove All Subjects"
        onConfirm={handleConfirmClearAllSubjects}
        onClose={() => setIsClearAllSubjectsOpen(false)}
      />

      {/* Reset Demo Data Confirmation */}
      <ConfirmModal
        isOpen={isResetDemoOpen}
        title="Reset to Sample Demo Subjects?"
        message="Would you like to restore the default sample courses (Computer Networks, Machine Learning, Data Structures) and realistic exam countdowns? Your current list will be replaced."
        confirmLabel="Reset Demo Data"
        isDestructive={false}
        onConfirm={handleConfirmResetDemo}
        onClose={() => setIsResetDemoOpen(false)}
      />
    </div>
  );
}
