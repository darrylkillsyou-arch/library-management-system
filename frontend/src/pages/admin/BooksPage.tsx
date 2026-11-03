import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksApi, categoriesApi, authorsApi } from '../../lib/api';
import type { Book, Category, Author } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus, Search, BookOpen, Edit, Eye, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/utils';

export function BooksPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author_id: '',
    category_id: '',
    publisher: '',
    publication_year: new Date().getFullYear().toString(),
    description: '',
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedCat, search]);

  const fetchMetadata = async () => {
    try {
      const [catsRes, authsRes] = await Promise.all([categoriesApi.list(), authorsApi.list()]);
      setCategories(catsRes.data);
      setAuthors(authsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await booksApi.list({
        page,
        page_size: 10,
        q: search || undefined,
        category_id: selectedCat ? Number(selectedCat) : undefined,
      });
      setBooks(res.data.items);
      setTotalPages(res.data.pages);
      setTotalCount(res.data.total);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({
      isbn: '',
      title: '',
      author_id: authors[0]?.id.toString() || '',
      category_id: categories[0]?.id.toString() || '',
      publisher: '',
      publication_year: new Date().getFullYear().toString(),
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Book) => {
    setEditingBook(b);
    setFormData({
      isbn: b.isbn,
      title: b.title,
      author_id: b.author_id.toString(),
      category_id: b.category_id.toString(),
      publisher: b.publisher || '',
      publication_year: b.publication_year ? b.publication_year.toString() : '',
      description: b.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        isbn: formData.isbn,
        title: formData.title,
        author_id: Number(formData.author_id),
        category_id: Number(formData.category_id),
        publisher: formData.publisher || null,
        publication_year: formData.publication_year ? Number(formData.publication_year) : null,
        description: formData.description || null,
      };

      if (editingBook) {
        await booksApi.update(editingBook.id, payload);
        toast.success('Book updated successfully');
      } else {
        await booksApi.create(payload);
        toast.success('Book added successfully');
      }
      setModalOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleArchive = async (b: Book) => {
    try {
      await booksApi.update(b.id, { is_archived: !b.is_archived });
      toast.success(b.is_archived ? 'Book restored' : 'Book archived');
      fetchBooks();
    } catch (err) {
      toast.error('Failed to update book archive status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Books Catalogue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage catalogue titles, physical accession copies, and classifications.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Book
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Book Table */}
      {loading ? (
        <Card className="p-6">
          <Skeleton lines={8} />
        </Card>
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Books Found"
          description="No catalogue records match your criteria. Add a title or clear the search filter."
          actionLabel="Add Book"
          onAction={handleOpenAdd}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-4">Title & ISBN</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Copies (Avail / Tot)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{b.title}</div>
                      <div className="text-xs font-mono text-slate-500">ISBN: {b.isbn}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {b.author?.name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">{b.category?.name || 'General'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {b.available_copies ?? 0}
                      </span>
                      <span className="text-slate-400"> / {b.total_copies ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/books/${b.id}`)}
                        title="View Copies"
                      >
                        <Eye size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(b)}
                        title="Edit Details"
                      >
                        <Edit size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleArchive(b)}
                        title={b.is_archived ? 'Restore' : 'Archive'}
                        className={b.is_archived ? 'text-amber-600' : 'text-slate-400'}
                      >
                        <Archive size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pages={totalPages}
            total={totalCount}
            onPageChange={(p) => setPage(p)}
          />
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBook ? 'Edit Book' : 'Add New Book'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="ISBN"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              placeholder="e.g. 978-0-13-604259-4"
              required
            />
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Book Title"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Author"
              value={formData.author_id}
              onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
              options={authors.map((a) => ({ value: a.id, label: a.name }))}
              required
            />
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Publisher"
              value={formData.publisher}
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              placeholder="e.g. Pearson"
            />
            <Input
              label="Publication Year"
              type="number"
              value={formData.publication_year}
              onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
              placeholder="e.g. 2022"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief summary of the textbook or volume..."
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingBook ? 'Save Changes' : 'Create Book'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
