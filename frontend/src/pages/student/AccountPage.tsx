import React, { useEffect, useState } from 'react';
import { authApi, membersApi } from '../../lib/api';
import type { Member } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { User, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, getErrorMessage } from '../../lib/utils';

export function AccountPage() {
  const [profile, setProfile] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authApi.me();
      setProfile(res.data);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await membersApi.update(profile.id, { password });
      toast.success('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Card className="p-6"><Skeleton lines={6} /></Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User size={24} className="text-teal-500" /> Account Profile & Credentials
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Institutional identity and portal authentication settings.
        </p>
      </div>

      {/* Profile Details Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg">
              {profile.full_name[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profile.full_name}</h2>
              <span className="text-xs font-mono text-slate-500">Roll No: {profile.roll_number}</span>
            </div>
          </div>
          <Badge variant={profile.role === 'admin' ? 'info' : 'success'}>
            {profile.role.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <span className="text-slate-400 block uppercase font-bold">Email Address</span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{profile.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold">Department</span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{profile.department || 'CSE'}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold">Academic Programme</span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{profile.programme || 'B.Tech CSE (AI & ML)'}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold">Registration Date</span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{formatDate(profile.joined_at)}</span>
          </div>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <KeyRound size={18} className="text-teal-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Security & Password Update
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" size="sm" loading={savingPassword}>
              <ShieldCheck size={16} /> Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
