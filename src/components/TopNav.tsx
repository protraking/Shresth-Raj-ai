import React from 'react';
import { Bell, BellRing, Moon, Sun, Volume2, VolumeX, Plus, Sparkles, Calendar } from 'lucide-react';
import { NotificationSettings } from '../types';

interface TopNavProps {
  activeTab: 'overview' | 'dayplan' | 'subjects' | 'deadlines' | 'planner' | 'notifications';
  setActiveTab: (tab: 'overview' | 'dayplan' | 'subjects' | 'deadlines' | 'planner' | 'notifications') => void;
  onOpenEasyAddModal: () => void;
  onOpenNotificationModal: () => void;
  onOpenSwift: () => void;
  isDark: boolean;
  toggleDark: () => void;
  notificationSettings: NotificationSettings;
  toggleSound: () => void;
  notificationPermission: NotificationPermission;
  urgentCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenEasyAddModal,
  onOpenNotificationModal,
  onOpenSwift,
  isDark,
  toggleDark,
  notificationSettings,
  toggleSound,
  notificationPermission,
  urgentCount,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className="text-left group flex items-center gap-2.5 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            S
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block font-display leading-tight">
              SyllabusDesk
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'overview'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('dayplan')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
            activeTab === 'dayplan'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Day-by-Day Study Plan</span>
          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded">
            Roadmap
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'subjects'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Syllabus & Coverage
        </button>

        <button
          onClick={() => setActiveTab('deadlines')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
            activeTab === 'deadlines'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Exams & Deadlines</span>
          {urgentCount > 0 && (
            <span className="text-xs px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold rounded tabular-nums">
              {urgentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'planner'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Daily Targets
        </button>
      </nav>

      {/* Zone 3: 1 primary action + compact utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Swift AI Button */}
        <button
          onClick={onOpenSwift}
          title="Open Swift AI Car Hologram Cockpit"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-700/60 hover:bg-cyan-100 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Swift AI</span>
        </button>

        <button
          onClick={toggleSound}
          title={notificationSettings.soundEnabled ? 'Alert chime enabled' : 'Alert chime muted'}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle alert sound"
        >
          {notificationSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>

        <button
          onClick={onOpenNotificationModal}
          title="Desktop Notification Settings"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
          aria-label="Desktop notification settings"
        >
          {notificationPermission === 'granted' ? <BellRing className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Bell className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenEasyAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Easy Add Course & Plan</span>
        </button>
      </div>
    </header>
  );
};
