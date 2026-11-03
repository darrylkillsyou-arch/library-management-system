// Shared TypeScript types matching backend schemas

export interface Author {
  id: number;
  name: string;
  book_count?: number;
}

export interface Category {
  id: number;
  name: string;
  book_count?: number;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author_id: number;
  category_id: number;
  publisher?: string;
  publication_year?: number;
  description?: string;
  cover_url?: string;
  is_archived: boolean;
  created_at: string;
  author?: Author;
  category?: Category;
  total_copies?: number;
  available_copies?: number;
  issued_copies?: number;
}

export interface BookCopy {
  id: number;
  book_id: number;
  accession_number: string;
  status: 'Available' | 'Issued' | 'Maintenance' | 'Lost';
  shelf_location?: string;
  book?: Book;
}

export interface Member {
  id: number;
  full_name: string;
  roll_number: string;
  email: string;
  role: 'admin' | 'student';
  department?: string;
  programme?: string;
  status: 'active' | 'inactive' | 'suspended';
  joined_at: string;
  active_loans?: number;
}

export interface Loan {
  id: number;
  copy_id: number;
  member_id: number;
  issued_on: string;
  due_on: string;
  returned_on?: string | null;
  issued_by: number;
  returned_to?: number | null;
  fine_amount?: number;
  is_overdue?: boolean;
  overdue_days?: number;
  copy?: BookCopy;
  member?: Member;
}

export interface DashboardMetrics {
  total_books: number;
  total_copies: number;
  available_copies: number;
  issued_copies: number;
  total_members: number;
  active_loans: number;
  overdue_loans: number;
  outstanding_fines: number;
}

export interface CategoryStat {
  name: string;
  book_count: number;
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  category_distribution: CategoryStat[];
  recent_loans: Loan[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AuthUser {
  member_id: number;
  full_name: string;
  role: 'admin' | 'student';
  access_token: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  performed_by?: number;
  details?: string;
  created_at: string;
}
