import { useEffect, useState } from 'react';
import { loansApi } from '../../lib/api';
import type { Loan } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Library, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../lib/utils';

export function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLoans();
  }, [page, search, activeOnly]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await loansApi.list({
        page,
        page_size: 10,
        q: search || undefined,
        active_only: activeOnly ? true : undefined,
      });
      setLoans(res.data.items);
      setTotalPages(res.data.pages);
      setTotalCount(res.data.total);
    } catch (err) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReturn = async (loanId: number) => {
    try {
      await loansApi.returnBook(loanId);
      toast.success('Book returned');
      fetchLoans();
    } catch (err) {
      toast.error('Failed to record return');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Library size={24} className="text-teal-500" /> Lending Transactions Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comprehensive audit log of issued, overdue, and returned books.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveOnly(true);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeOnly
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Active Loans Only
          </button>
          <button
            onClick={() => {
              setActiveOnly(false);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              !activeOnly
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by book title or accession number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><Skeleton lines={8} /></Card>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No Loans Found"
          description="There are currently no active or historical loans matching your criteria."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-4">Loan ID</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Book & Accession</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status & Fine</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">#{l.id}</td>
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
                    <td className="py-3 px-4 text-xs text-slate-500">{formatDate(l.issued_on)}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{formatDate(l.due_on)}</td>
                    <td className="py-3 px-4">
                      {l.returned_on ? (
                        <div className="space-y-0.5">
                          <Badge variant="neutral">Returned {formatDate(l.returned_on)}</Badge>
                          {(l.fine_amount ?? 0) > 0 && (
                            <span className="text-[11px] font-semibold text-rose-500 block">
                              Fine: {formatCurrency(l.fine_amount!)}
                            </span>
                          )}
                        </div>
                      ) : l.is_overdue ? (
                        <div className="space-y-0.5">
                          <Badge variant="danger">Overdue ({l.overdue_days}d)</Badge>
                          <span className="text-[11px] font-semibold text-rose-600 block">
                            Due: {formatCurrency(l.fine_amount ?? 0)}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="info">Active</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!l.returned_on && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickReturn(l.id)}
                          title="Record Return"
                        >
                          <RotateCcw size={13} /> Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={totalPages} total={totalCount} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
