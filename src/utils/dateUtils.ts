export interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  formatted: string;
  urgency: 'overdue' | 'today' | 'tomorrow' | 'urgent' | 'soon' | 'normal';
}

/**
 * Compute detailed time remaining from now until target date
 */
export function getTimeRemaining(targetDateStr: string): TimeRemaining {
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const isOverdue = diffMs < 0;
  const absMs = Math.abs(diffMs);

  const seconds = Math.floor((absMs / 1000) % 60);
  const minutes = Math.floor((absMs / (1000 * 60)) % 60);
  const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));

  let urgency: TimeRemaining['urgency'] = 'normal';
  if (isOverdue) {
    urgency = 'overdue';
  } else if (days === 0) {
    urgency = 'today';
  } else if (days === 1) {
    urgency = 'tomorrow';
  } else if (days <= 3) {
    urgency = 'urgent';
  } else if (days <= 7) {
    urgency = 'soon';
  }

  let formatted = '';
  if (isOverdue) {
    formatted = days === 0 ? `Overdue by ${hours}h ${minutes}m` : `Overdue by ${days}d ${hours}h`;
  } else if (days === 0) {
    formatted = `${hours}h ${minutes}m left`;
  } else if (days === 1) {
    formatted = `1 day, ${hours}h left`;
  } else {
    formatted = `${days} days left`;
  }

  return {
    totalMs: diffMs,
    days: isOverdue ? -days : days,
    hours,
    minutes,
    seconds,
    isOverdue,
    formatted,
    urgency,
  };
}

/**
 * Given a number of days left, calculate an ISO date string (YYYY-MM-DDTHH:mm)
 */
export function calculateDateFromDaysLeft(daysLeft: number, timeStr = '09:00'): string {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(0, Math.round(daysLeft)));
  const [hours, mins] = timeStr.split(':').map(Number);
  date.setHours(hours || 9, mins || 0, 0, 0);
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Format date for input[type="datetime-local"]
 */
export function formatForDateTimeInput(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Pretty human readable date display
 */
export function formatPrettyDate(dateStr: string): string {
  if (!dateStr) return 'No date set';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Short date string like "Nov 12, 2026"
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Calculate study velocity required
 */
export function calculateVelocity(remainingTopics: number, remainingHours: number, daysLeft: number) {
  const safeDays = Math.max(1, daysLeft);
  const topicsPerDay = (remainingTopics / safeDays);
  const hoursPerDay = (remainingHours / safeDays);

  return {
    topicsPerDay: Number(topicsPerDay.toFixed(1)),
    hoursPerDay: Number(hoursPerDay.toFixed(1)),
    isCrunch: topicsPerDay > 3 || hoursPerDay > 4,
    isComfortable: topicsPerDay <= 1.2 && hoursPerDay <= 2,
  };
}
