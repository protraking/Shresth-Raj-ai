import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Send,
  HelpCircle,
} from 'lucide-react';
import { NotificationSettings, NotificationLog } from '../types';
import {
  requestNotificationPermission,
  sendDesktopNotification,
  getNotificationLogs,
  clearNotificationLogs,
} from '../utils/notifications';
import { playNotificationChime } from '../utils/audio';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  permission: NotificationPermission;
  onPermissionChange: (perm: NotificationPermission) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  permission,
  onPermissionChange,
}) => {
  const [logs, setLogs] = useState<NotificationLog[]>(() => getNotificationLogs());
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    onPermissionChange(res);
    if (res === 'granted') {
      sendDesktopNotification(
        '🎉 Notifications Enabled!',
        { body: 'SyllabusDesk will alert you before exams and assignments are due.' },
        settings.soundEnabled
      );
      setLogs(getNotificationLogs());
    }
  };

  const handleSendTestNotification = () => {
    if (permission !== 'granted') {
      setTestStatusMessage('Please grant browser notification permission first.');
      return;
    }

    const success = sendDesktopNotification(
      '⏰ Exam Reminder: Linear Algebra Final',
      {
        body: 'Upcoming in 3 days! Complete remaining 4 topics (SVD & Differential Equations).',
      },
      settings.soundEnabled
    );

    if (success) {
      setTestStatusMessage('Test notification sent! Check your desktop notification center.');
      setLogs(getNotificationLogs());
      setTimeout(() => setTestStatusMessage(null), 5000);
    } else {
      setTestStatusMessage('Failed to trigger notification. Verify system notifications are allowed.');
    }
  };

  const handleTestSound = () => {
    playNotificationChime();
  };

  const handleClearLogs = () => {
    clearNotificationLogs();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                Desktop Notifications & Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive browser and desktop banners for approaching exam and assignment deadlines.
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Permission Status Box */}
          <div className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Browser Permission
              </span>
              <div className="mt-1 flex items-center gap-2">
                {permission === 'granted' ? (
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Granted & Active
                  </span>
                ) : permission === 'denied' ? (
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Blocked by Browser
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> Needs Permission
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {permission !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  Enable Desktop Alerts
                </button>
              ) : (
                <button
                  onClick={handleSendTestNotification}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Notification</span>
                </button>
              )}
            </div>
          </div>

          {testStatusMessage && (
            <div className="p-3 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
              {testStatusMessage}
            </div>
          )}

          {/* Trigger Thresholds */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Deadline Alert Thresholds
            </h4>

            <div className="space-y-2 text-sm">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white block text-xs">
                    7 Days Before Exam or Assignment
                  </span>
                  <span className="text-[11px] text-slate-500">Early warning to structure syllabus revision</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notify7Days}
                  onChange={e => onUpdateSettings({ ...settings, notify7Days: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white block text-xs">
                    3 Days Before Due Date
                  </span>
                  <span className="text-[11px] text-slate-500">Urgent reminder to wrap up remaining topics</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notify3Days}
                  onChange={e => onUpdateSettings({ ...settings, notify3Days: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white block text-xs">
                    1 Day Before (Tomorrow)
                  </span>
                  <span className="text-[11px] text-slate-500">Final preparation and revision alert</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notify1Day}
                  onChange={e => onUpdateSettings({ ...settings, notify1Day: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white block text-xs">
                    Due Day / Exam Day
                  </span>
                  <span className="text-[11px] text-slate-500">Morning alert on the exact test or submission date</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyDueDay}
                  onChange={e => onUpdateSettings({ ...settings, notifyDueDay: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Sound Settings */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                  Audible Notification Chime
                </span>
                <span className="text-[11px] text-slate-500">
                  Play harmonic tone when desktop alerts trigger
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTestSound}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                title="Preview sound"
              >
                <Play className="w-3 h-3" /> Preview
              </button>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          {/* Notification Activity History Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Alert History ({logs.length})
              </h4>
              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear History
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-850 rounded-lg">
                No notifications logged yet. Trigger a test notification above to see it appear here.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {log.title}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 line-clamp-1">
                        {log.body}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
