import React, { useEffect, useState } from 'react';
import { authorsApi } from '../../lib/api';
import type { Author } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/utils';

export function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [name, setName] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, [search]);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const res = await authorsApi.list(search || undefined);
      setAuthors(res.data);
    } catch (err) {
      toast.error('Failed to load authors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAuthor(null);
    setName('');
    setModalOpen(true);
  };

  const handleOpenEdit = (a: Author) => {
    setEditingAuthor(a);
    setName(a.name);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setFormLoading(true);
    try {
      if (editingAuthor) {
        await authorsApi.update(editingAuthor.id, { name: name.trim() });
        toast.success('Author updated');
      } else {
        await authorsApi.create({ name: name.trim() });
        toast.success('Author created');
      }
      setModalOpen(false);
      fetchAuthors();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (a: Author) => {
    if (!confirm(`Are you sure you want to delete author "${a.name}"?`)) return;
    try {
      await authorsApi.delete(a.id);
      toast.success('Author removed');
      fetchAuthors();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users size={22} className="text-teal-500" /> Authors Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Maintain author entities linked with academic book titles.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add Author
        </Button>
      </div>

      <Card className="p-4">
        <input
          type="text"
          placeholder="Search authors by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </Card>

      {loading ? (
        <Card className="p-6"><Skeleton lines={6} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <th className="py-3 px-4">Author Name</th>
                <th className="py-3 px-4 text-center">Catalogued Books</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {authors.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{a.name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {a.book_count ?? 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(a)}>
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(a)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAuthor ? 'Edit Author' : 'Add Author'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Abraham Silberschatz"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingAuthor ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
