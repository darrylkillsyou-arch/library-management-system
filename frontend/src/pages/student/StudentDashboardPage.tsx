import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loansApi, authApi } from '../../lib/api';
import type { Loan, Member } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  BookOpen,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Member | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meRes, loansRes] = await Promise.all([
        authApi.me(),
        loansApi.list({ page_size: 10 }),
      ]);
      setProfile(meRes.data);
      setLoans(loansRes.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeLoans = loans.filter((l) => !l.returned_on);
  const totalFines = activeLoans.reduce((acc, l) => acc + (l.fine_amount ?? 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="h-28 p-4"><Skeleton lines={2} /></Card>
          <Card className="h-28 p-4"><Skeleton lines={2} /></Card>
          <Card className="h-28 p-4"><Skeleton lines={2} /></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111742] to-[#1a266f] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap size={16} /> Student Reading Portal
          </div>
          <h1 className="text-2xl font-black">
            Welcome, {profile?.full_name || 'Student'}!
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Roll No: <span className="font-mono text-teal-300">{profile?.roll_number}</span> &bull; {profile?.programme || 'B.Tech CSE (AI & ML)'}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/student/catalogue')}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          Browse Catalogue <ArrowRight size={14} />
        </Button>
      </div>

      {/* Quota & Fines Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">Active Borrowing</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {activeLoans.length} / 2 Books
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">Standard Lending</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              14 Calendar Days
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              totalFines > 0
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
            }`}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">Outstanding Fines</span>
            <span
              className={`text-xl font-black ${
                totalFines > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(totalFines)}
            </span>
          </div>
        </Card>
      </div>

      {/* Active Loans List */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar size={18} className="text-teal-500" />
            Your Currently Borrowed Books ({activeLoans.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/borrowings')}>
            View History
          </Button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            You do not currently have any books checked out. Explore the catalogue!
          </div>
        ) : (
          <div className="space-y-3">
            {activeLoans.map((l) => (
              <div
                key={l.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                  l.is_overdue
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {l.copy?.book?.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Accession: <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{l.copy?.accession_number}</span> &bull; Issued: {formatDate(l.issued_on)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Due Date</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(l.due_on)}
                    </span>
                  </div>
                  {l.is_overdue ? (
                    <Badge variant="danger">
                      Overdue ({l.overdue_days}d &bull; {formatCurrency(l.fine_amount ?? 0)})
                    </Badge>
                  ) : (
                    <Badge variant="info">Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
