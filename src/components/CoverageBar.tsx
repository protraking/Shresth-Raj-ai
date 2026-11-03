import React from 'react';

interface CoverageBarProps {
  completedPercentage: number;
  inProgressPercentage?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  totalTopics?: number;
  completedTopics?: number;
  remainingTopics?: number;
}

export const CoverageBar: React.FC<CoverageBarProps> = ({
  completedPercentage,
  inProgressPercentage = 0,
  color = 'indigo',
  size = 'md',
  showDetails = true,
  totalTopics,
  completedTopics,
  remainingTopics,
}) => {
  const remainingPercentage = Math.max(0, 100 - completedPercentage - inProgressPercentage);

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colorStyles: Record<string, { completed: string; inProgress: string; bg: string; text: string }> = {
    indigo: { completed: 'bg-indigo-600 dark:bg-indigo-500', inProgress: 'bg-indigo-300 dark:bg-indigo-400/50', bg: 'bg-indigo-50 dark:bg-slate-800', text: 'text-indigo-600 dark:text-indigo-400' },
    emerald: { completed: 'bg-emerald-600 dark:bg-emerald-500', inProgress: 'bg-emerald-300 dark:bg-emerald-400/50', bg: 'bg-emerald-50 dark:bg-slate-800', text: 'text-emerald-600 dark:text-emerald-400' },
    rose: { completed: 'bg-rose-600 dark:bg-rose-500', inProgress: 'bg-rose-300 dark:bg-rose-400/50', bg: 'bg-rose-50 dark:bg-slate-800', text: 'text-rose-600 dark:text-rose-400' },
    amber: { completed: 'bg-amber-600 dark:bg-amber-500', inProgress: 'bg-amber-300 dark:bg-amber-400/50', bg: 'bg-amber-50 dark:bg-slate-800', text: 'text-amber-600 dark:text-amber-400' },
    sky: { completed: 'bg-sky-600 dark:bg-sky-500', inProgress: 'bg-sky-300 dark:bg-sky-400/50', bg: 'bg-sky-50 dark:bg-slate-800', text: 'text-sky-600 dark:text-sky-400' },
    violet: { completed: 'bg-violet-600 dark:bg-violet-500', inProgress: 'bg-violet-300 dark:bg-violet-400/50', bg: 'bg-violet-50 dark:bg-slate-800', text: 'text-violet-600 dark:text-violet-400' },
    teal: { completed: 'bg-teal-600 dark:bg-teal-500', inProgress: 'bg-teal-300 dark:bg-teal-400/50', bg: 'bg-teal-50 dark:bg-slate-800', text: 'text-teal-600 dark:text-teal-400' },
  };

  const scheme = colorStyles[color] || colorStyles.indigo;

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="font-semibold">{completedPercentage}% covered</span>
            {totalTopics !== undefined && completedTopics !== undefined && (
              <>
                <span className="text-slate-400" aria-hidden="true">·</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {completedTopics} of {totalTopics} topics
                </span>
              </>
            )}
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            <span className="tabular-nums font-mono font-medium">{remainingPercentage}% remaining</span>
            {remainingTopics !== undefined && (
              <span className="ml-1 text-slate-400">({remainingTopics} to go)</span>
            )}
          </div>
        </div>
      )}

      {/* Progress track */}
      <div className={`w-full overflow-hidden rounded-full ${scheme.bg} ${heightClasses[size]} flex items-center`}>
        {completedPercentage > 0 && (
          <div
            className={`${scheme.completed} h-full transition-all duration-300 ease-out`}
            style={{ width: `${Math.min(100, completedPercentage)}%` }}
            title={`Completed: ${completedPercentage}%`}
          />
        )}
        {inProgressPercentage > 0 && (
          <div
            className={`${scheme.inProgress} h-full transition-all duration-300 ease-out`}
            style={{ width: `${Math.min(100 - completedPercentage, inProgressPercentage)}%` }}
            title={`In Progress: ${inProgressPercentage}%`}
          />
        )}
      </div>
    </div>
  );
};
