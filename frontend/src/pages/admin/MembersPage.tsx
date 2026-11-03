import React, { useEffect, useState } from 'react';
import { membersApi } from '../../lib/api';
import type { Member } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus, Search, UserCheck, Edit, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, formatDate } from '../../lib/utils';

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    email: '',
    password: '',
    role: 'student',
    department: 'CSE',
    programme: 'B.Tech CSE (AI & ML)',
    status: 'active',
  });

  useEffect(() => {
    fetchMembers();
  }, [page, search, roleFilter]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await membersApi.list({
        page,
        page_size: 10,
        q: search || undefined,
        role: roleFilter || undefined,
      });
      setMembers(res.data.items);
      setTotalPages(res.data.pages);
      setTotalCount(res.data.total);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      full_name: '',
      roll_number: '',
      email: '',
      password: '',
      role: 'student',
      department: 'CSE',
      programme: 'B.Tech CSE (AI & ML)',
      status: 'active',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({
      full_name: m.full_name,
      roll_number: m.roll_number,
      email: m.email,
      password: '',
      role: m.role,
      department: m.department || '',
      programme: m.programme || '',
      status: m.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingMember) {
        const payload: Record<string, unknown> = {
          full_name: formData.full_name,
          email: formData.email,
          department: formData.department,
          programme: formData.programme,
          status: formData.status,
        };
        if (formData.password) payload.password = formData.password;
        await membersApi.update(editingMember.id, payload);
        toast.success('Member updated');
      } else {
        await membersApi.create(formData);
        toast.success('Member registered');
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (m: Member) => {
    const nextStatus = m.status === 'active' ? 'suspended' : 'active';
    try {
      await membersApi.update(m.id, { status: nextStatus });
      toast.success(`Member status set to ${nextStatus}`);
      fetchMembers();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck size={22} className="text-teal-500" /> Member Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enforce roll numbers, active loan limits, and role access policies.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Register Member
        </Button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, roll number, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="w-full md:w-44">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><Skeleton lines={8} /></Card>
      ) : members.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Members Found"
          description="Try modifying search queries or filters."
          actionLabel="Add Member"
          onAction={handleOpenAdd}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Active Loans</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{m.full_name}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {m.roll_number}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={m.role === 'admin' ? 'info' : 'neutral'}>
                        {m.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        (m.active_loans ?? 0) >= 2
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {m.active_loans ?? 0} / 2
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={m.status === 'active' ? 'success' : 'danger'}>
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(m.joined_at)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(m)} title="Edit Member">
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(m)}
                        title={m.status === 'active' ? 'Suspend Member' : 'Activate Member'}
                        className={m.status === 'active' ? 'text-amber-500' : 'text-emerald-500'}
                      >
                        <ShieldOff size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={totalPages} total={totalCount} onPageChange={setPage} />
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? 'Edit Member Profile' : 'Register New University Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Student / Faculty Name"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Roll Number / ID"
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
              placeholder="e.g. 251302024"
              disabled={!!editingMember}
              required
            />
            <Input
              label="University Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@libranest.demo"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={editingMember ? 'Change Password (optional)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!editingMember}
            />
            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'admin', label: 'Librarian / Admin' },
              ]}
              disabled={!!editingMember}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. CSE"
            />
            <Input
              label="Programme"
              value={formData.programme}
              onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
              placeholder="e.g. B.Tech CSE (AI & ML)"
            />
          </div>

          {editingMember && (
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingMember ? 'Save Changes' : 'Register'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
