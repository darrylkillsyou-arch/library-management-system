import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className="space-y-2.5 w-full">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('h-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse', className)}
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('h-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse', className)} />
  );
}
