import React, { useState } from 'react';
import { booksApi, membersApi, loansApi } from '../../lib/api';
import type { Book, BookCopy, Member, Loan } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  BookPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, formatDate } from '../../lib/utils';
import { addDays } from 'date-fns';

export function IssueBookPage() {
  // Step 1: Member Selection
  const [memberSearch, setMemberSearch] = useState('');
  const [searchingMember, setSearchingMember] = useState(false);
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Step 2: Book & Copy Selection
  const [bookSearch, setBookSearch] = useState('');
  const [searchingBook, setSearchingBook] = useState(false);
  const [bookResults, setBookResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [availableCopies, setAvailableCopies] = useState<BookCopy[]>([]);
  const [selectedCopyId, setSelectedCopyId] = useState<string>('');

  // Transaction state
  const [issuing, setIssuing] = useState(false);
  const [recentTransaction, setRecentTransaction] = useState<Loan | null>(null);

  const issueDate = new Date();
  const dueDate = addDays(issueDate, 14);

  const handleSearchMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberSearch.trim()) return;
    setSearchingMember(true);
    try {
      const res = await membersApi.list({ q: memberSearch.trim(), page_size: 5 });
      setMemberResults(res.data.items);
      if (res.data.items.length === 0) {
        toast.error('No member found with that name/roll number');
      }
    } catch (err) {
      toast.error('Error querying members');
    } finally {
      setSearchingMember(false);
    }
  };

  const handleSearchBooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookSearch.trim()) return;
    setSearchingBook(true);
    try {
      const res = await booksApi.list({ q: bookSearch.trim(), page_size: 5 });
      setBookResults(res.data.items);
      if (res.data.items.length === 0) {
        toast.error('No book matching title/ISBN');
      }
    } catch (err) {
      toast.error('Error querying books');
    } finally {
      setSearchingBook(false);
    }
  };

  const handleSelectBook = async (b: Book) => {
    setSelectedBook(b);
    setSelectedCopyId('');
    try {
      const res = await booksApi.getCopies(b.id);
      const avail = res.data.filter((c: BookCopy) => c.status === 'Available');
      setAvailableCopies(avail);
      if (avail.length > 0) {
        setSelectedCopyId(avail[0].id.toString());
      }
    } catch (err) {
      toast.error('Failed to load physical copies');
    }
  };

  const handleIssueBook = async () => {
    if (!selectedMember || !selectedCopyId) return;

    if ((selectedMember.active_loans ?? 0) >= 2) {
      toast.error('Student has reached the maximum quota of 2 active loans.');
      return;
    }

    setIssuing(true);
    try {
      const res = await loansApi.issue({
        member_id: selectedMember.id,
        copy_id: Number(selectedCopyId),
      });
      toast.success('Book issued successfully!');
      setRecentTransaction(res.data);

      // Refresh student loan count locally
      setSelectedMember({
        ...selectedMember,
        active_loans: (selectedMember.active_loans ?? 0) + 1,
      });

      // Reset book selection
      setSelectedBook(null);
      setAvailableCopies([]);
      setSelectedCopyId('');
      setBookResults([]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookPlus size={24} className="text-teal-500" /> Book Issue Desk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enforce the 2-loan active student limit, 14-day cycle, and transactional inventory lock.
        </p>
      </div>

      {/* Success Transaction Banner */}
      {recentTransaction && (
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 flex items-start gap-3">
          <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
              Issue Transaction Confirmed (Loan #{recentTransaction.id})
            </span>
            <p className="text-emerald-800 dark:text-emerald-300 text-xs mt-0.5">
              Copy <span className="font-mono font-semibold">{recentTransaction.copy?.accession_number}</span> issued to{' '}
              <span className="font-semibold">{recentTransaction.member?.full_name}</span>. Due on{' '}
              <span className="font-semibold">{formatDate(recentTransaction.due_on)}</span>.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Member Selection */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserCheck size={18} className="text-teal-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">
              1. Select Student Member
            </h2>
          </div>

          <form onSubmit={handleSearchMembers} className="flex gap-2">
            <Input
              placeholder="Search name or roll number..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="text-xs"
            />
            <Button type="submit" variant="secondary" size="sm" loading={searchingMember}>
              <Search size={14} />
            </Button>
          </form>

          {/* Member Search Results */}
          {memberResults.length > 0 && !selectedMember && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
              {memberResults.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex justify-between items-center transition-colors text-xs"
                >
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-slate-100">{m.full_name}</span>
                    <span className="text-slate-500 font-mono">{m.roll_number}</span>
                  </div>
                  <Badge variant={(m.active_loans ?? 0) >= 2 ? 'danger' : 'neutral'}>
                    {m.active_loans ?? 0}/2 Active
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Selected Member Display */}
          {selectedMember && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedMember.full_name}</h3>
                  <p className="text-xs font-mono text-slate-500">{selectedMember.roll_number}</p>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-xs text-teal-600 hover:underline font-semibold"
                >
                  Change
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs">
                <span className="text-slate-500">Active Borrowings:</span>
                <span
                  className={`font-mono font-bold ${
                    (selectedMember.active_loans ?? 0) >= 2 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedMember.active_loans ?? 0} of 2 Allowed
                </span>
              </div>

              {(selectedMember.active_loans ?? 0) >= 2 && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 dark:bg-red-950/40 p-2 rounded">
                  <AlertCircle size={14} /> Student has reached maximum loan limit (2).
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Step 2: Book & Physical Copy Selection */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Layers size={18} className="text-teal-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">
              2. Select Title & Copy
            </h2>
          </div>

          <form onSubmit={handleSearchBooks} className="flex gap-2">
            <Input
              placeholder="Search title or ISBN..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              className="text-xs"
            />
            <Button type="submit" variant="secondary" size="sm" loading={searchingBook}>
              <Search size={14} />
            </Button>
          </form>

          {/* Book Search Results */}
          {bookResults.length > 0 && !selectedBook && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
              {bookResults.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBook(b)}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex justify-between items-center transition-colors text-xs"
                >
                  <div className="max-w-[70%]">
                    <span className="font-bold block truncate text-slate-900 dark:text-slate-100">{b.title}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{b.isbn}</span>
                  </div>
                  <Badge variant={b.available_copies && b.available_copies > 0 ? 'success' : 'danger'}>
                    {b.available_copies ?? 0} Avail
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Selected Book & Copies Dropdown */}
          {selectedBook && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-start">
                <div className="max-w-[80%]">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {selectedBook.title}
                  </h3>
                  <p className="text-xs text-slate-500">ISBN: {selectedBook.isbn}</p>
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-xs text-teal-600 hover:underline font-semibold"
                >
                  Change
                </button>
              </div>

              {availableCopies.length === 0 ? (
                <p className="text-xs text-red-500 font-medium">
                  No copies currently available in stock.
                </p>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Physical Copy
                  </label>
                  <select
                    value={selectedCopyId}
                    onChange={(e) => setSelectedCopyId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    {availableCopies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.accession_number} — Shelf: {c.shelf_location || 'General'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Lending Summary & Submission Card */}
      <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-teal-50/30 dark:from-slate-900 dark:to-teal-950/20 border-teal-500/30">
        <div className="flex items-center gap-3 text-sm">
          <Calendar size={20} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold block text-slate-800 dark:text-slate-200">
              Standard 14-Day Lending Period
            </span>
            <span className="text-slate-500">
              Issued Today &bull; Due on <span className="font-bold text-teal-600 dark:text-teal-400">{formatDate(dueDate)}</span>
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          loading={issuing}
          disabled={!selectedMember || !selectedCopyId || (selectedMember.active_loans ?? 0) >= 2}
          onClick={handleIssueBook}
        >
          Confirm & Issue Book
        </Button>
      </Card>
    </div>
  );
}
