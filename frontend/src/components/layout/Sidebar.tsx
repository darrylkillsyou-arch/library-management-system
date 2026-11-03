import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Tag,
  UserCheck,
  BookPlus,
  BookMarked,
  Library,
  AlertCircle,
  FileText,
  Info,
  GraduationCap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/books', label: 'Books Catalogue', icon: BookOpen },
  { to: '/admin/authors', label: 'Authors', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/members', label: 'Members', icon: UserCheck },
  { to: '/admin/issue', label: 'Issue Book', icon: BookPlus },
  { to: '/admin/return', label: 'Return Book', icon: BookMarked },
  { to: '/admin/loans', label: 'Active Loans', icon: Library },
  { to: '/admin/overdue', label: 'Overdue & Fines', icon: AlertCircle },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/about', label: 'About Project', icon: Info },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside
      className="w-64 h-screen flex flex-col flex-shrink-0 text-slate-100 select-none shadow-xl border-r border-slate-800"
      style={{ backgroundColor: '#111742' }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-black text-xl shadow-inner">
          <GraduationCap size={24} />
        </div>
        <div>
          <h1 className="font-extrabold tracking-wider text-base text-white">LIBRANEST</h1>
          <p className="text-[10px] tracking-wide text-teal-400 font-semibold uppercase">University Library</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 font-semibold border-l-4 border-teal-400 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                )
              }
            >
              <Icon size={18} className="transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/10 bg-black/20 text-[11px] text-slate-400 flex flex-col gap-0.5">
        <span className="font-medium text-slate-300">SGT University — DBMS TA1+TA2</span>
        <span>B.Tech CSE (AI & ML)</span>
      </div>
    </aside>
  );
}
