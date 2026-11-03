import { useEffect, useState } from 'react';
import { loansApi } from '../../lib/api';
import type { Loan } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Library, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../lib/utils';

export function MyBorrowingsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await loansApi.list({ page_size: 50 });
      setLoans(res.data.items);
    } catch {
      toast.error('Failed to load your loans');
    } finally {
      setLoading(false);
    }
  };

  const activeLoans = loans.filter((l) => !l.returned_on);
  const historyLoans = loans.filter((l) => !!l.returned_on);
  const displayedLoans = tab === 'active' ? activeLoans : historyLoans;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Library size={24} className="text-teal-500" /> My Borrowing Ledger & Fines
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track current due dates, return confirmations, and calculated overdue fines.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setTab('active')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={14} /> Active Loans ({activeLoans.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={14} /> Return History ({historyLoans.length})
          </button>
        </div>
      </div>

      {loading ? (
        <Card className="p-6"><Skeleton lines={6} /></Card>
      ) : displayedLoans.length === 0 ? (
        <EmptyState
          icon={Library}
          title={tab === 'active' ? 'No Active Loans' : 'No Borrowing History'}
          description={
            tab === 'active'
              ? 'You do not have any physical textbooks currently checked out.'
              : 'You have not completed any previous returns yet.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-4">Book Title & Accession</th>
                  <th className="py-3 px-4">Issued On</th>
                  <th className="py-3 px-4">{tab === 'active' ? 'Due Date' : 'Returned On'}</th>
                  <th className="py-3 px-4">Lending Window</th>
                  <th className="py-3 px-4 text-right">Status & Fines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayedLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {l.copy?.book?.title}
                      </div>
                      <div className="text-xs font-mono text-teal-600 dark:text-teal-400">
                        Accession: {l.copy?.accession_number}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{formatDate(l.issued_on)}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tab === 'active' ? formatDate(l.due_on) : formatDate(l.returned_on)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      14 Days Standard
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.returned_on ? (
                        <div>
                          <Badge variant="neutral">Returned</Badge>
                          {(l.fine_amount ?? 0) > 0 && (
                            <span className="text-xs font-bold text-rose-500 block mt-0.5">
                              Fine Paid: {formatCurrency(l.fine_amount!)}
                            </span>
                          )}
                        </div>
                      ) : l.is_overdue ? (
                        <div>
                          <Badge variant="danger">{l.overdue_days} Days Overdue</Badge>
                          <span className="text-xs font-bold text-rose-600 block mt-0.5">
                            Fine: {formatCurrency(l.fine_amount ?? 0)}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="info">Active On-Time</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Overdue Fine Policy Note */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
        <AlertCircle size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            University Library Borrowing Regulations
          </span>
          Books are issued for 14 calendar days. A late charge of INR 2 per day accumulates automatically after the due date. On-time returns carry zero fine.
        </div>
      </div>
    </div>
  );
}
