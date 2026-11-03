import { useEffect, useState } from 'react';
import { loansApi } from '../../lib/api';
import type { Loan } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { AlertCircle, IndianRupee, RotateCcw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../lib/utils';

export function OverduePage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    try {
      setLoading(true);
      const res = await loansApi.list({
        overdue_only: true,
        active_only: true,
        page_size: 50,
      });
      setLoans(res.data.items);
    } catch (err) {
      toast.error('Failed to load overdue list');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id: number) => {
    try {
      await loansApi.returnBook(id);
      toast.success('Book returned and copy made available');
      fetchOverdue();
    } catch (err) {
      toast.error('Failed to return book');
    }
  };

  const totalOutstandingFines = loans.reduce((acc, l) => acc + (l.fine_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertCircle size={24} className="text-rose-600" /> Overdue Borrowings & Fine Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Active loans past the 14-day threshold incurring daily charges (₹2.00/day).
          </p>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Overdue Copies
            </span>
            <span className="text-2xl font-black text-rose-600">{loans.length} Books</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Cumulative Fine Total
            </span>
            <span className="text-2xl font-black text-amber-600">
              {formatCurrency(totalOutstandingFines)}
            </span>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card className="p-6"><Skeleton lines={6} /></Card>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Overdue Books!"
          description="All active library loans are within their 14-day borrowing cycles."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Book & Accession</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Overdue Days</th>
                  <th className="py-3 px-4">Fine Incurred</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {l.member?.full_name}
                      </div>
                      <div className="text-xs font-mono text-slate-500">{l.member?.roll_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {l.copy?.book?.title}
                      </div>
                      <div className="text-xs font-mono text-teal-600 dark:text-teal-400">
                        {l.copy?.accession_number}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(l.due_on)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="danger">{l.overdue_days} Days Late</Badge>
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600">
                      {formatCurrency(l.fine_amount ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReturn(l.id)}
                        title="Process Return"
                      >
                        <RotateCcw size={13} /> Collect & Return
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
