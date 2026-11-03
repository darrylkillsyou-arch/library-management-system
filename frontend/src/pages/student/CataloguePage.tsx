import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksApi, categoriesApi } from '../../lib/api';
import type { Book, Category } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Search, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export function CataloguePage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, search, categoryFilter, availableOnly]);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.list();
      setCategories(res.data);
    } catch {
      console.error('Failed to load categories');
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await booksApi.list({
        page,
        page_size: 9,
        q: search || undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
        available_only: availableOnly ? true : undefined,
      });
      setBooks(res.data.items);
      setTotalPages(res.data.pages);
      setTotalCount(res.data.total);
    } catch {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookOpen size={24} className="text-teal-500" /> University Library Catalogue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Discover required textbooks, reference treatises, and research publications.
        </p>
      </div>

      {/* Filter Controls */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search titles, authors, or ISBN..."
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
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Disciplines</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => {
              setAvailableOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          Available Now Only
        </label>
      </Card>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 h-64"><Skeleton lines={4} /></Card>
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Books Found"
          description="Try broadening your search term or clearing filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((b) => (
              <Card
                key={b.id}
                onClick={() => navigate(`/student/catalogue/${b.id}`)}
                className="p-5 flex flex-col justify-between hover:shadow-lg hover:border-teal-500/50 cursor-pointer transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="neutral">{b.category?.name || 'General'}</Badge>
                    <Badge
                      variant={
                        b.available_copies && b.available_copies > 0 ? 'success' : 'danger'
                      }
                    >
                      {b.available_copies ?? 0} In Stock
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-teal-600 transition-colors line-clamp-2">
                      {b.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      By <span className="font-semibold text-slate-700 dark:text-slate-300">{b.author?.name}</span>
                    </p>
                  </div>

                  {b.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {b.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">ISBN: {b.isbn}</span>
                  <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
                    <Layers size={13} />
                    <span>{b.total_copies ?? 0} Copies</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} pages={totalPages} total={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
