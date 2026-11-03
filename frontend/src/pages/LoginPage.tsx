import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, ShieldCheck, BookOpen, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const stored = localStorage.getItem('libranest_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'admin' | 'student1' | 'student2') => {
    if (type === 'admin') {
      setEmail('admin@libranest.demo');
      setPassword('Admin@123');
    } else if (type === 'student1') {
      setEmail('aakash@libranest.demo');
      setPassword('Student@123');
    } else {
      setEmail('bhavna@libranest.demo');
      setPassword('Student@123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Banner */}
      <div
        className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0b1033 0%, #17278b 60%, #0d9488 100%)',
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center justify-center font-bold">
              <GraduationCap size={28} />
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider text-white">LIBRANEST</span>
              <p className="text-xs uppercase tracking-widest text-teal-300 font-medium">University Library System</p>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug mt-8 mb-4">
            Reliable, normalized database-backed university library management.
          </h2>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-lg">
            Built for SGT University, Gurugram — B.Tech CSE (AI & ML) DBMS project.
            Featuring complete ACID-compliant transactions, 14-day lending windows, fine calculation engine, and strict role permissions.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10 max-w-lg">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="text-teal-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-slate-200">
                <span className="font-semibold text-white block">Strict Constraints</span>
                2-loan limits, unforgeable accession tracking.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <BookOpen className="text-teal-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-slate-200">
                <span className="font-semibold text-white block">Overdue Fine Engine</span>
                ₹2 per calendar day automatic tallying.
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 mt-8 border-t border-white/10 text-xs text-slate-300">
          Designed by Pushkar, Prashant & Jatin &bull; B.Tech CSE (AI & ML)
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in to LibraNest</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Access book catalogue, borrowing records, or admin desk.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@libranest.demo"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              <KeyRound size={14} className="text-teal-500" />
              <span>Quick Demo Accounts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('student1')}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Student (Limit)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('student2')}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Student (Overdue)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
