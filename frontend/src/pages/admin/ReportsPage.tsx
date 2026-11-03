import { useState } from 'react';
import { booksApi, loansApi, dashboardApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Download, BookOpen, Layers, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) {
    toast.error('No records available to export.');
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${filename}`);
}

export function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExportBooks = async () => {
    setDownloading('books');
    try {
      const res = await booksApi.list({ page: 1, page_size: 1000 });
      const rows = res.data.items.map((b: any) => ({
        ID: b.id,
        ISBN: b.isbn,
        Title: b.title,
        Author: b.author?.name || '',
        Category: b.category?.name || '',
        Publisher: b.publisher || '',
        Year: b.publication_year || '',
        TotalCopies: b.total_copies || 0,
        AvailableCopies: b.available_copies || 0,
        IssuedCopies: b.issued_copies || 0,
      }));
      downloadCSV(rows, `libranest_books_report_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      toast.error('Failed to export books');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportActiveLoans = async () => {
    setDownloading('loans');
    try {
      const res = await loansApi.list({ active_only: true, page_size: 1000 });
      const rows = res.data.items.map((l: any) => ({
        LoanID: l.id,
        AccessionNo: l.copy?.accession_number || '',
        BookTitle: l.copy?.book?.title || '',
        MemberName: l.member?.full_name || '',
        MemberRoll: l.member?.roll_number || '',
        IssuedOn: l.issued_on,
        DueOn: l.due_on,
        IsOverdue: l.is_overdue ? 'YES' : 'NO',
        OverdueDays: l.overdue_days || 0,
        FineEstimateINR: l.fine_amount || 0,
      }));
      downloadCSV(rows, `libranest_active_loans_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      toast.error('Failed to export active loans');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportOverdue = async () => {
    setDownloading('overdue');
    try {
      const res = await loansApi.list({ overdue_only: true, active_only: true, page_size: 1000 });
      const rows = res.data.items.map((l: any) => ({
        LoanID: l.id,
        MemberRoll: l.member?.roll_number || '',
        MemberName: l.member?.full_name || '',
        BookTitle: l.copy?.book?.title || '',
        AccessionNo: l.copy?.accession_number || '',
        DueOn: l.due_on,
        OverdueDays: l.overdue_days || 0,
        CalculatedFineINR: l.fine_amount || 0,
      }));
      downloadCSV(rows, `libranest_overdue_fines_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      toast.error('Failed to export overdue records');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportInventory = async () => {
    setDownloading('inventory');
    try {
      const res = await dashboardApi.getAllCopies();
      const rows = res.data.map((c: any) => ({
        CopyID: c.id,
        AccessionNumber: c.accession_number,
        BookTitle: c.book?.title || '',
        Status: c.status,
        ShelfLocation: c.shelf_location || '',
      }));
      downloadCSV(rows, `libranest_physical_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      toast.error('Failed to export physical inventory');
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      title: 'Complete Books Catalogue',
      description: 'Export all indexed textbook titles, classifications, and stock totals.',
      icon: BookOpen,
      action: handleExportBooks,
      key: 'books',
    },
    {
      title: 'Active Borrowings Registry',
      description: 'Currently borrowed copies, associated students, and upcoming due dates.',
      icon: Clock,
      action: handleExportActiveLoans,
      key: 'loans',
    },
    {
      title: 'Overdue Fines Audit',
      description: 'Books beyond the 14-day cycle with INR 2/day accrued fines.',
      icon: AlertTriangle,
      action: handleExportOverdue,
      key: 'overdue',
    },
    {
      title: 'Physical Inventory & Accessions',
      description: 'Complete breakdown of individual accession barcodes, statuses, and shelf placements.',
      icon: Layers,
      action: handleExportInventory,
      key: 'inventory',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText size={24} className="text-teal-500" /> Database Query Reports & CSV Exports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate structured institutional CSV dumps directly from the normalized DBMS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.key} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{r.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="pt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  loading={downloading === r.key}
                  onClick={r.action}
                >
                  <Download size={14} /> Download CSV Report
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
