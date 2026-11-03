import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksApi } from '../../lib/api';
import type { Book, BookCopy } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowLeft, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function BookDetailStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch {
      toast.error('Failed to load book record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card className="p-6"><Skeleton lines={6} /></Card>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/student/catalogue')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Library Catalogue
      </button>

      {/* Main Info Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-28 h-36 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 flex flex-col items-center justify-center text-teal-600 dark:text-teal-400 p-2 text-center flex-shrink-0 shadow-inner">
            <BookOpen size={36} className="mb-2" />
            <span className="text-[10px] font-mono leading-tight">{book.isbn}</span>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{book.category?.name || 'Category'}</Badge>
              <Badge variant={book.available_copies && book.available_copies > 0 ? 'success' : 'danger'}>
                {book.available_copies ?? 0} Copies Currently Available
              </Badge>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
              {book.title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block uppercase font-bold">Author</span>
                <span className="font-semibold text-sm">{book.author?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Publisher</span>
                <span className="font-semibold text-sm">{book.publisher || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Edition Year</span>
                <span className="font-semibold text-sm">{book.publication_year || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Total Holdings</span>
                <span className="font-semibold text-sm">{book.total_copies ?? 0} Copies</span>
              </div>
            </div>
          </div>
        </div>

        {book.description && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Abstract & Overview
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {book.description}
            </p>
          </div>
        )}
      </Card>

      {/* Copy Availability Breakdown */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers size={18} className="text-teal-500" />
          Physical Holdings & Stacks Shelf Locations
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <th className="py-2.5 px-3">Accession Number</th>
                <th className="py-2.5 px-3">Stack / Shelf Location</th>
                <th className="py-2.5 px-3 text-right">Circulation Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {copies.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 px-3 font-mono font-bold text-xs">{c.accession_number}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-xs">
                    {c.shelf_location || 'General Circulation Stacks'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Badge variant={c.status === 'Available' ? 'success' : 'neutral'}>
                      {c.status === 'Available' ? 'Available to Issue at Desk' : 'Currently On Loan'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
        <CheckCircle2 size={16} />
        <span>
          To borrow an available copy, take its Accession Number to the library circulation desk with your Student ID card.
        </span>
      </div>
    </div>
  );
}
