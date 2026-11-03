import { useEffect, useState } from 'react';
import { dashboardApi } from '../../lib/api';
import type { DashboardResponse } from '../../types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatCurrency } from '../../lib/utils';
import {
  BookOpen,
  Copy,
  CheckCircle,
  Clock,
  Users,
  AlertTriangle,
  IndianRupee,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.get();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-8 w-2/3" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-80 p-4"><Skeleton className="h-full w-full" /></Card>
          <Card className="h-80 p-4"><Skeleton className="h-full w-full" /></Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const m = data.metrics;

  const metricCards = [
    { title: 'Total Book Titles', value: m.total_books, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { title: 'Physical Copies', value: m.total_copies, icon: Copy, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { title: 'Available Copies', value: m.available_copies, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { title: 'Currently Issued', value: m.issued_copies, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { title: 'Registered Members', value: m.total_members, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    { title: 'Active Loans', value: m.active_loans, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { title: 'Overdue Loans', value: m.overdue_loans, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { title: 'Est. Outstanding Fines', value: formatCurrency(m.outstanding_fines), icon: IndianRupee, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  ];

  const COLORS = ['#2d55f2', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#6366f1', '#f43f5e'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Library Control Center</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Real-time metrics, collection statistics, and recent transactions from SQLite/PostgreSQL.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color} flex-shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {card.title}
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {card.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Bar Chart */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Books by Academic Discipline
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.category_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="book_count" fill="#2d55f2" radius={[4, 4, 0, 0]} name="Titles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Share Pie Chart */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Catalogue Proportion
          </h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_distribution}
                  dataKey="book_count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {data.category_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-5 overflow-hidden">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Recent Library Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Loan ID</th>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Book Title</th>
                <th className="py-2.5 px-3">Issued Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.recent_loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-500">#{loan.id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {loan.member?.full_name || `Member #${loan.member_id}`}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {loan.copy?.book?.title || 'Unknown Title'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">{formatDate(loan.issued_on)}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">{formatDate(loan.due_on)}</td>
                  <td className="py-2.5 px-3">
                    {loan.returned_on ? (
                      <Badge variant="neutral">Returned</Badge>
                    ) : loan.is_overdue ? (
                      <Badge variant="danger">Overdue ({loan.overdue_days}d)</Badge>
                    ) : (
                      <Badge variant="info">Active</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
