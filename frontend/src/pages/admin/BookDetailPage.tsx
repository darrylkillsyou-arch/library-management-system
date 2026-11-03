import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksApi } from '../../lib/api';
import type { Book, BookCopy } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowLeft, Plus, Edit2, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/utils';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Copy Modal
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyFormLoading, setCopyFormLoading] = useState(false);
  const [copyData, setCopyData] = useState({
    accession_number: '',
    shelf_location: '',
    status: 'Available',
  });

  // Edit Copy Modal
  const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [bookRes, copiesRes] = await Promise.all([
        booksApi.get(Number(id)),
        booksApi.getCopies(Number(id)),
      ]);
      setBook(bookRes.data);
      setCopies(copiesRes.data);
    } catch (err) {
      toast.error('Failed to load book copies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyData.accession_number) return;
    setCopyFormLoading(true);
    try {
      await booksApi.addCopy(Number(id), {
        book_id: Number(id),
        accession_number: copyData.accession_number,
        shelf_location: copyData.shelf_location || null,
        status: copyData.status,
      });
      toast.success('Copy registered successfully');
      setCopyModalOpen(false);
      setCopyData({ accession_number: '', shelf_location: '', status: 'Available' });
      fetchDetails();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCopyFormLoading(false);
    }
  };

  const handleUpdateCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCopy) return;
    setCopyFormLoading(true);
    try {
      await booksApi.updateCopy(editingCopy.id, {
        status: editingCopy.status,
        shelf_location: editingCopy.shelf_location,
      });
      toast.success('Copy updated');
      setEditingCopy(null);
      fetchDetails();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCopyFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card className="p-6"><Skeleton lines={4} /></Card>
        <Card className="p-6"><Skeleton lines={6} /></Card>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Book not found.</p>
        <Button variant="secondary" onClick={() => navigate('/admin/books')} className="mt-4">
          Back to Catalogue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/books')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Books Catalogue
      </button>

      {/* Book Metadata Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-32 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-2 text-center flex-shrink-0">
            <BookOpen size={32} className="mb-1 text-teal-500" />
            <span className="text-[10px] font-mono leading-tight">{book.isbn}</span>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{book.category?.name || 'Category'}</Badge>
              {book.is_archived && <Badge variant="warning">Archived</Badge>}
            </div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{book.title}</h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">Author</span>
                <span className="font-semibold">{book.author?.name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Publisher</span>
                <span className="font-semibold">{book.publisher || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Year</span>
                <span className="font-semibold">{book.publication_year || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Available / Total</span>
                <span className="font-semibold text-emerald-600">
                  {book.available_copies} / {book.total_copies}
                </span>
              </div>
            </div>

            {book.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-2">
                {book.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Physical Copies Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers size={18} className="text-teal-500" />
            Physical Inventory & Accession Copies ({copies.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Each copy has a distinct accession number and shelf location.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCopyModalOpen(true)}>
          <Plus size={15} /> Add Copy
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <th className="py-2.5 px-4">Accession No</th>
                <th className="py-2.5 px-4">Shelf Location</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {copies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    {c.accession_number}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                    {c.shelf_location || 'General Stacks'}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge
                      variant={
                        c.status === 'Available'
                          ? 'success'
                          : c.status === 'Issued'
                          ? 'info'
                          : 'danger'
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCopy(c)}
                      title="Edit Copy Status"
                    >
                      <Edit2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Copy Modal */}
      <Modal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title="Register Physical Copy"
      >
        <form onSubmit={handleAddCopy} className="space-y-4">
          <Input
            label="Accession Number"
            value={copyData.accession_number}
            onChange={(e) => setCopyData({ ...copyData, accession_number: e.target.value })}
            placeholder="e.g. ACC101"
            required
          />
          <Input
            label="Shelf Location"
            value={copyData.shelf_location}
            onChange={(e) => setCopyData({ ...copyData, shelf_location: e.target.value })}
            placeholder="e.g. A3-Shelf-2"
          />
          <Select
            label="Initial Status"
            value={copyData.status}
            onChange={(e) => setCopyData({ ...copyData, status: e.target.value })}
            options={[
              { value: 'Available', label: 'Available' },
              { value: 'Maintenance', label: 'Maintenance' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCopyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={copyFormLoading}>
              Register Copy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Copy Modal */}
      <Modal
        isOpen={!!editingCopy}
        onClose={() => setEditingCopy(null)}
        title={`Edit Copy: ${editingCopy?.accession_number}`}
      >
        {editingCopy && (
          <form onSubmit={handleUpdateCopy} className="space-y-4">
            <Input
              label="Shelf Location"
              value={editingCopy.shelf_location || ''}
              onChange={(e) =>
                setEditingCopy({ ...editingCopy, shelf_location: e.target.value })
              }
            />
            <Select
              label="Status"
              value={editingCopy.status}
              onChange={(e) =>
                setEditingCopy({
                  ...editingCopy,
                  status: e.target.value as BookCopy['status'],
                })
              }
              options={[
                { value: 'Available', label: 'Available' },
                { value: 'Issued', label: 'Issued' },
                { value: 'Maintenance', label: 'Maintenance' },
                { value: 'Lost', label: 'Lost' },
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditingCopy(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={copyFormLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
