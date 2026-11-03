import { Outlet, NavLink } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BookOpen, Library, User, Info, GraduationCap } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StudentLayout() {
  const navItems = [
    { to: '/student/dashboard', label: 'My Portal', icon: Library },
    { to: '/student/catalogue', label: 'Book Catalogue', icon: BookOpen },
    { to: '/student/borrowings', label: 'My Loans & Fines', icon: Library },
    { to: '/student/account', label: 'Profile Settings', icon: User },
    { to: '/about', label: 'About', icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <TopBar />

      {/* Sub-navigation bar for students */}
      <div className="bg-[#111742] text-white border-b border-white/10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2 gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10 hidden sm:flex">
            <GraduationCap size={20} className="text-teal-400" />
            <span className="font-extrabold text-sm tracking-wide">LIBRANEST</span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        LIBRANEST &copy; 2026 University Library Management System — SGT University, Gurugram
      </footer>
    </div>
  );
}
