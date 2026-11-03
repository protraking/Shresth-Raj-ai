import { Assessment, NotificationLog, NotificationSettings, Subject } from '../types';
import { getTimeRemaining } from './dateUtils';
import { playNotificationChime } from './audio';

const STORAGE_KEY_NOTIFICATIONS_SENT = 'syllabusdesk_notifications_sent_v1';
const STORAGE_KEY_LOGS = 'syllabusdesk_notification_logs_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Send an immediate desktop notification
 */
export function sendDesktopNotification(
  title: string,
  options?: NotificationOptions,
  playSound = true
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      silent: false,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    if (playSound) {
      playNotificationChime();
    }
    return true;
  } catch (err) {
    console.error('Failed to trigger desktop notification:', err);
    return false;
  }
}

/**
 * Get IDs of notifications already sent
 */
function getSentNotificationKeys(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS_SENT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordNotificationSent(key: string) {
  try {
    const sent = getSentNotificationKeys();
    sent[key] = Date.now();
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS_SENT, JSON.stringify(sent));
  } catch {
    // ignore
  }
}

export function getNotificationLogs(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addNotificationLog(log: Omit<NotificationLog, 'id' | 'timestamp'>) {
  try {
    const logs = getNotificationLogs();
    const newLog: NotificationLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearNotificationLogs() {
  localStorage.removeItem(STORAGE_KEY_LOGS);
  localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS_SENT);
}

/**
 * Evaluate all assessments against deadlines and notification thresholds
 */
export function checkUpcomingDeadlinesAndNotify(
  assessments: Assessment[],
  subjects: Subject[],
  settings: NotificationSettings
): { notifiedCount: number; messages: string[] } {
  if (!settings.enabled || getNotificationPermission() !== 'granted') {
    return { notifiedCount: 0, messages: [] };
  }

  const subjectMap = new Map<string, Subject>();
  subjects.forEach(s => subjectMap.set(s.id, s));

  const sentKeys = getSentNotificationKeys();
  let notifiedCount = 0;
  const messages: string[] = [];

  for (const item of assessments) {
    if (item.isCompleted) continue;

    const remaining = getTimeRemaining(item.dueDate);
    if (remaining.isOverdue) continue;

    const subject = subjectMap.get(item.subjectId);
    const subjectPrefix = subject ? `[${subject.code || subject.name}] ` : '';
    const itemLabel = item.type.toUpperCase();

    // Check 7 days threshold (between 6.8 and 7.2 days, or if within 7 days and never notified)
    if (settings.notify7Days && remaining.days <= 7 && remaining.days >= 4) {
      const key = `${item.id}_7d`;
      if (!sentKeys[key]) {
        const title = `⚠️ ${subjectPrefix}${item.title} in 7 Days`;
        const body = `${itemLabel} is scheduled for ${new Date(item.dueDate).toLocaleDateString()}. Make sure your syllabus revision is on track!`;
        if (sendDesktopNotification(title, { body }, settings.soundEnabled)) {
          recordNotificationSent(key);
          addNotificationLog({ assessmentId: item.id, title, body });
          messages.push(title);
          notifiedCount++;
        }
      }
    }

    // Check 3 days threshold
    if (settings.notify3Days && remaining.days <= 3 && remaining.days >= 2) {
      const key = `${item.id}_3d`;
      if (!sentKeys[key]) {
        const title = `🚨 3 Days Until ${subjectPrefix}${item.title}`;
        const body = `${itemLabel} due in ${remaining.formatted}. Review pending topics and practice test material!`;
        if (sendDesktopNotification(title, { body }, settings.soundEnabled)) {
          recordNotificationSent(key);
          addNotificationLog({ assessmentId: item.id, title, body });
          messages.push(title);
          notifiedCount++;
        }
      }
    }

    // Check 1 day threshold
    if (settings.notify1Day && remaining.days === 1) {
      const key = `${item.id}_1d`;
      if (!sentKeys[key]) {
        const title = `⏰ Tomorrow: ${subjectPrefix}${item.title}`;
        const body = `Final preparation reminder! ${item.title} is due tomorrow (${remaining.formatted}). Good luck!`;
        if (sendDesktopNotification(title, { body }, settings.soundEnabled)) {
          recordNotificationSent(key);
          addNotificationLog({ assessmentId: item.id, title, body });
          messages.push(title);
          notifiedCount++;
        }
      }
    }

    // Check Due Day / Today threshold
    if (settings.notifyDueDay && remaining.days === 0 && !remaining.isOverdue) {
      const key = `${item.id}_0d`;
      if (!sentKeys[key]) {
        const title = `🔥 DUE TODAY: ${subjectPrefix}${item.title}`;
        const body = `Only ${remaining.hours} hours and ${remaining.minutes} minutes remaining! ${item.title} is today.`;
        if (sendDesktopNotification(title, { body }, settings.soundEnabled)) {
          recordNotificationSent(key);
          addNotificationLog({ assessmentId: item.id, title, body });
          messages.push(title);
          notifiedCount++;
        }
      }
    }
  }

  return { notifiedCount, messages };
}
