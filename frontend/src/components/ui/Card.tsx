import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm',
        padding && 'p-6',
        className
      )}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      {...rest}
    >
      {children}
    </div>
  );
}
