import React, { useState } from 'react';
import { loansApi } from '../../lib/api';
import type { Loan } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  BookMarked,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, formatDate, formatCurrency } from '../../lib/utils';

export function ReturnBookPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Return execution state
  const [returning, setReturning] = useState(false);
  const [completedLoan, setCompletedLoan] = useState<Loan | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelectedLoan(null);
    try {
      const res = await loansApi.list({
        q: query.trim(),
        active_only: true,
        page_size: 10,
      });
      setLoans(res.data.items);
      if (res.data.items.length === 0) {
        toast.error('No active loan matching criteria');
      }
    } catch (err) {
      toast.error('Error finding active loans');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedLoan) return;
    setReturning(true);
    try {
      const res = await loansApi.returnBook(selectedLoan.id);
      setCompletedLoan(res.data);
      toast.success('Book returned successfully!');
      setSelectedLoan(null);
      // Remove from results list
      setLoans((prev) => prev.filter((l) => l.id !== selectedLoan.id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookMarked size={24} className="text-teal-500" /> Book Return & Fine Audit
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Releases copy back into Available status and computes late return fine at ₹2/day.
        </p>
      </div>

      {/* Completed Return Receipt Banner */}
      {completedLoan && (
        <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              Return Receipt Confirmed (Loan #{completedLoan.id})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-emerald-200 dark:border-emerald-800">
            <div>
              <span className="text-slate-500 block">Copy Accession</span>
              <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                {completedLoan.copy?.accession_number}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Member</span>
              <span className="font-semibold">{completedLoan.member?.full_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Returned On</span>
              <span className="font-semibold">{formatDate(completedLoan.returned_on)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Calculated Fine</span>
              <span className="font-bold text-rose-600">
                {formatCurrency(completedLoan.fine_amount ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="p-5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            placeholder="Search by accession number (e.g. ACC002), book title, or student name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="primary" loading={searching} className="flex-shrink-0">
            <Search size={16} /> Locate Active Loan
          </Button>
        </form>
      </Card>

      {/* Matching Active Loans Table */}
      {loans.length > 0 && (
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Matching Active Loans ({loans.length})
          </h2>
          <div className="space-y-2">
            {loans.map((l) => (
              <div
                key={l.id}
                onClick={() => setSelectedLoan(l)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                  selectedLoan?.id === l.id
                    ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {l.copy?.book?.title || 'Book Title'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      {l.copy?.accession_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Borrower: <span className="font-semibold text-slate-700 dark:text-slate-300">{l.member?.full_name}</span>{' '}
                    ({l.member?.roll_number}) &bull; Due: {formatDate(l.due_on)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {l.is_overdue ? (
                    <Badge variant="danger">
                      {l.overdue_days} Days Late ({formatCurrency(l.fine_amount ?? 0)})
                    </Badge>
                  ) : (
                    <Badge variant="success">On-Time</Badge>
                  )}
                  <Button
                    variant={selectedLoan?.id === l.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLoan(l);
                    }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Selected Loan Detailed Review & Fine Clearance */}
      {selectedLoan && (
        <Card className="p-6 space-y-6 border-teal-500/40">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-teal-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Return Settlement Summary (Loan #{selectedLoan.id})
              </h2>
            </div>
            <Badge variant={selectedLoan.is_overdue ? 'danger' : 'success'}>
              {selectedLoan.is_overdue ? 'Overdue Status' : 'Within Due Date'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Student</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {selectedLoan.member?.full_name}
              </span>
              <span className="text-slate-400 block font-mono">{selectedLoan.member?.roll_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Book Title</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate block">
                {selectedLoan.copy?.book?.title}
              </span>
              <span className="text-slate-400 block font-mono">{selectedLoan.copy?.accession_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Issued On</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(selectedLoan.issued_on)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Due On</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(selectedLoan.due_on)}
              </span>
            </div>
          </div>

          {/* Fine Computation Box */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              selectedLoan.is_overdue
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {selectedLoan.is_overdue ? (
                <AlertTriangle size={24} className="text-rose-600" />
              ) : (
                <CheckCircle2 size={24} className="text-emerald-600" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block text-slate-700 dark:text-slate-300">
                  {selectedLoan.is_overdue ? 'Overdue Fine Applicable' : 'No Overdue Fine'}
                </span>
                <p className="text-xs text-slate-500">
                  {selectedLoan.is_overdue
                    ? `${selectedLoan.overdue_days} overdue days @ ₹2.00 per calendar day.`
                    : 'The book is returned within the 14-day borrowing window.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fine Payable</span>
              <span
                className={`text-2xl font-black ${
                  selectedLoan.is_overdue ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(selectedLoan.fine_amount ?? 0)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setSelectedLoan(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={returning} onClick={handleConfirmReturn}>
              Confirm Return & Make Copy Available
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
