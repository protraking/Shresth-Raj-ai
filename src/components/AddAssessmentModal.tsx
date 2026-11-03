import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Award, BookOpen } from 'lucide-react';
import { Assessment, AssessmentType, Subject } from '../types';
import { calculateDateFromDaysLeft, formatForDateTimeInput } from '../utils/dateUtils';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAssessment: (assessment: Assessment) => void;
  subjects: Subject[];
  initialAssessment?: Assessment | null;
}

export const AddAssessmentModal: React.FC<AddAssessmentModalProps> = ({
  isOpen,
  onClose,
  onSaveAssessment,
  subjects,
  initialAssessment,
}) => {
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssessmentType>('exam');
  const [useDaysMode, setUseDaysMode] = useState<boolean>(true);
  const [daysFromNow, setDaysFromNow] = useState<number>(7);
  const [exactDueDate, setExactDueDate] = useState<string>(() => calculateDateFromDaysLeft(7, '10:00'));
  const [weightPercentage, setWeightPercentage] = useState<number>(20);
  const [syllabusScope, setSyllabusScope] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialAssessment) {
      setSubjectId(initialAssessment.subjectId);
      setTitle(initialAssessment.title);
      setType(initialAssessment.type);
      setExactDueDate(formatForDateTimeInput(initialAssessment.dueDate));
      setWeightPercentage(initialAssessment.weightPercentage || 0);
      setSyllabusScope(initialAssessment.syllabusScope || '');
      setNotes(initialAssessment.notes || '');
      setUseDaysMode(false);
    } else {
      setSubjectId(subjects[0]?.id || '');
      setTitle('');
      setType('exam');
      setDaysFromNow(7);
      setExactDueDate(calculateDateFromDaysLeft(7, '10:00'));
      setWeightPercentage(20);
      setSyllabusScope('');
      setNotes('');
      setUseDaysMode(true);
    }
  }, [initialAssessment, subjects, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;

    const dueDate = useDaysMode
      ? calculateDateFromDaysLeft(daysFromNow, '10:00')
      : exactDueDate;

    const assessmentToSave: Assessment = {
      id: initialAssessment ? initialAssessment.id : `ass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectId,
      title: title.trim(),
      type,
      dueDate,
      weightPercentage: Number(weightPercentage) || 0,
      isCompleted: initialAssessment ? initialAssessment.isCompleted : false,
      syllabusScope: syllabusScope.trim(),
      notes: notes.trim(),
      remindersSent: initialAssessment?.remindersSent || [],
    };

    onSaveAssessment(assessmentToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                {initialAssessment ? 'Edit Assessment Deadline' : 'Add Exam or Assignment'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track exact due date, syllabus chapters covered, and desktop alert timers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Subject & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Course / Subject *
              </label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `${s.code} · ` : ''}{s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assessment Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as AssessmentType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="exam">Major Exam / Midterm / Final</option>
                <option value="assignment">Assignment / Problem Set</option>
                <option value="quiz">Weekly Quiz</option>
                <option value="project">Course Project / Paper</option>
                <option value="presentation">Presentation / Lab</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assessment Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Midterm 2: Reaction Kinetics & Conformations"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Due Date & Days Mode */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Due Date / Days Remaining
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-[11px]">
                <button
                  type="button"
                  onClick={() => setUseDaysMode(true)}
                  className={`px-2 py-0.5 rounded font-medium ${
                    useDaysMode ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Days from Now
                </button>
                <button
                  type="button"
                  onClick={() => setUseDaysMode(false)}
                  className={`px-2 py-0.5 rounded font-medium ${
                    !useDaysMode ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Exact Date & Time
                </button>
              </div>
            </div>

            {useDaysMode ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={daysFromNow}
                    onChange={e => setDaysFromNow(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-1.5 text-base font-bold font-mono text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    days from today
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Target Due Date:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(calculateDateFromDaysLeft(daysFromNow)).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={exactDueDate}
                    onChange={e => setExactDueDate(e.target.value)}
                    required
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Weight & Scope */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Grade Weight %</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={weightPercentage}
                onChange={e => setWeightPercentage(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Syllabus Scope</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Unit 1 to Unit 3 (Sections 2.1-4.3)"
                value={syllabusScope}
                onChange={e => setSyllabusScope(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Exam Hall / Submission Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Bring photo ID and blue book. Formulas printed on page 1."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !subjectId}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {initialAssessment ? 'Save Changes' : 'Add Deadline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
