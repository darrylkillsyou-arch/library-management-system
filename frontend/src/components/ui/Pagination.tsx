import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({ page, pages, total, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t border-slate-200 dark:border-slate-800">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{pages}</span> ({total} items)
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} /> Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
