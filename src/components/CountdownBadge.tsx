import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getTimeRemaining, TimeRemaining } from '../utils/dateUtils';

interface CountdownBadgeProps {
  targetDate: string;
  isCompleted?: boolean;
  compact?: boolean;
  showSeconds?: boolean;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  targetDate,
  isCompleted = false,
  compact = false,
  showSeconds = false,
}) => {
  const [time, setTime] = useState<TimeRemaining>(() => getTimeRemaining(targetDate));

  useEffect(() => {
    // Tick every second if showSeconds or due soon, else every 10 seconds
    const intervalMs = showSeconds || time.days <= 1 ? 1000 : 10000;
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [targetDate, showSeconds, time.days]);

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Completed</span>
      </span>
    );
  }

  if (time.isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span className="font-mono tabular-nums">{time.formatted}</span>
      </span>
    );
  }

  const urgencyStyles = {
    today: 'text-rose-600 dark:text-rose-400 font-semibold',
    tomorrow: 'text-amber-600 dark:text-amber-400 font-semibold',
    urgent: 'text-amber-700 dark:text-amber-400 font-medium',
    soon: 'text-indigo-600 dark:text-indigo-400 font-medium',
    normal: 'text-slate-600 dark:text-slate-300 font-medium',
    overdue: 'text-rose-600 dark:text-rose-400 font-semibold',
  };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${urgencyStyles[time.urgency]}`}>
        <Clock className="w-3 h-3 shrink-0 opacity-70" />
        <span className="font-mono tabular-nums">
          {time.days === 0
            ? `${time.hours}h ${time.minutes}m`
            : `${time.days}d ${time.hours}h`}
        </span>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${urgencyStyles[time.urgency]}`}>
      <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <div className="font-mono tabular-nums flex items-center gap-1">
        {time.days > 0 && (
          <span className="font-semibold text-sm">{time.days} <span className="text-xs font-normal opacity-80">days</span></span>
        )}
        <span className={time.days === 0 ? 'font-semibold text-sm' : 'opacity-90'}>
          {time.hours} <span className="text-xs font-normal opacity-70">hrs</span>
        </span>
        <span className="opacity-80">
          {time.minutes} <span className="text-xs font-normal opacity-70">min</span>
        </span>
        {showSeconds && (
          <span className="opacity-60 text-[11px]">
            {time.seconds}s
          </span>
        )}
      </div>
      {time.urgency === 'today' && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 rounded">
          Due Today
        </span>
      )}
      {time.urgency === 'tomorrow' && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 rounded">
          Tomorrow
        </span>
      )}
    </div>
  );
};
