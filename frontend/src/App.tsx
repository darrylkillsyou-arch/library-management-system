import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import { AdminLayout } from './components/layout/AdminLayout';
import { StudentLayout } from './components/layout/StudentLayout';

// Public & Error Pages
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { BooksPage } from './pages/admin/BooksPage';
import { BookDetailPage } from './pages/admin/BookDetailPage';
import { AuthorsPage } from './pages/admin/AuthorsPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { MembersPage } from './pages/admin/MembersPage';
import { IssueBookPage } from './pages/admin/IssueBookPage';
import { ReturnBookPage } from './pages/admin/ReturnBookPage';
import { LoansPage } from './pages/admin/LoansPage';
import { OverduePage } from './pages/admin/OverduePage';
import { ReportsPage } from './pages/admin/ReportsPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { CataloguePage } from './pages/student/CataloguePage';
import { BookDetailStudentPage } from './pages/student/BookDetailStudentPage';
import { MyBorrowingsPage } from './pages/student/MyBorrowingsPage';
import { AccountPage } from './pages/student/AccountPage';

function ProtectedRoute({
  children,
  roleRequired,
}: {
  children: React.ReactNode;
  roleRequired?: 'admin' | 'student';
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired === 'admin' && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/student/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Admin Area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />
        <Route path="authors" element={<AuthorsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="issue" element={<IssueBookPage />} />
        <Route path="return" element={<ReturnBookPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="overdue" element={<OverduePage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Student Area */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="catalogue" element={<CataloguePage />} />
        <Route path="catalogue/:id" element={<BookDetailStudentPage />} />
        <Route path="borrowings" element={<MyBorrowingsPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
