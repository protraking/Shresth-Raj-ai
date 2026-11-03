import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen } from 'lucide-react';
import { Subject } from '../types';
import { calculateDateFromDaysLeft } from '../utils/dateUtils';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: Subject, openImportImmediately?: boolean) => void;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAddSubject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('indigo');
  const [daysLeft, setDaysLeft] = useState<number>(14);
  const [exactDate, setExactDate] = useState<string>(() => calculateDateFromDaysLeft(14, '09:00'));
  const [useDaysLeftMode, setUseDaysLeftMode] = useState<boolean>(true);
  const [credits, setCredits] = useState<number>(3);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const colorOptions = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-600' },
    { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
    { id: 'sky', label: 'Sky', bg: 'bg-sky-600' },
    { id: 'violet', label: 'Violet', bg: 'bg-violet-600' },
    { id: 'teal', label: 'Teal', bg: 'bg-teal-600' },
  ];

  const handleSubmit = (openImport: boolean) => {
    if (!name.trim()) return;

    const targetExamDate = useDaysLeftMode
      ? calculateDateFromDaysLeft(daysLeft, '09:00')
      : exactDate;

    const newSubject: Subject = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color,
      targetExamDate,
      credits,
      notes: notes.trim(),
      units: [
        {
          id: `u_${Date.now()}_1`,
          title: 'Unit 1: Fundamentals & Core Principles',
          topics: [],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddSubject(newSubject, openImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                Add New Subject / Course
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your course details and set the days left until exam.
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
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Name & Code */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subject Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Operating Systems & Concurrency"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Code
              </label>
              <input
                type="text"
                placeholder="CS 310"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Color Tag */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${
                    color === c.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Target Exam Date / Days Left Switcher */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Exam Deadline & Days Left
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-[11px]">
                <button
                  type="button"
                  onClick={() => setUseDaysLeftMode(true)}
                  className={`px-2 py-0.5 rounded font-medium ${
                    useDaysLeftMode ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Enter Days Left
                </button>
                <button
                  type="button"
                  onClick={() => setUseDaysLeftMode(false)}
                  className={`px-2 py-0.5 rounded font-medium ${
                    !useDaysLeftMode ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pick Exact Date
                </button>
              </div>
            </div>

            {useDaysLeftMode ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={daysLeft}
                      onChange={e => setDaysLeft(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 px-3 py-1.5 text-base font-bold font-mono text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Days Left until Exam
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Calculated Exam Date:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(calculateDateFromDaysLeft(daysLeft)).toLocaleDateString('en-US', {
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
                    value={exactDate}
                    onChange={e => setExactDate(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Credits & Notes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Credits
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={credits}
                onChange={e => setCredits(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes / Syllabus Focus
              </label>
              <input
                type="text"
                placeholder="e.g. Formula sheet provided, focus on Unit 2 & 3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={!name.trim()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Create Subject
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={!name.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            Create & Paste Syllabus
          </button>
        </div>
      </div>
    </div>
  );
};
