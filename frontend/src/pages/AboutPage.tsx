import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  GraduationCap,
  Database,
  ShieldCheck,
  Code2,
  Clock,
  Layers,
  Users,
  CheckCircle2,
} from 'lucide-react';

export function AboutPage() {
  const team = [
    { name: 'Pushkar', roll: '251302024', role: 'Full-Stack & Database Architecture' },
    { name: 'Prashant', roll: '251302077', role: 'Backend API & Business Logic' },
    { name: 'Jatin', roll: '251302100', role: 'Frontend UI/UX & Data Visualization' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold tracking-wider uppercase border border-teal-500/20">
          <GraduationCap size={16} /> Academic Project Presentation
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          LIBRANEST
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          University Library Management System &bull; DBMS TA1 + TA2 Combined Submission
        </p>
      </div>

      {/* Academic Context */}
      <Card className="border-l-4 border-l-[#1a266f]">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <Database size={20} className="text-[#1a266f] dark:text-teal-400" />
          Academic Context & Affiliation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Institution</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">SGT University, Gurugram</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Programme</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">B.Tech CSE (AI & ML)</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Course</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Database Management Systems</span>
          </div>
        </div>
      </Card>

      {/* Team Members */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Users size={20} className="text-teal-500" />
          Project Team Members
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {team.map((m) => (
            <Card key={m.roll} className="hover:border-teal-500/50 transition-colors">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
              <div className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400 mt-0.5">
                Roll No: {m.roll}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{m.role}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Code2 size={20} className="text-teal-500" />
          Technology Stack
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center p-4">
            <Layers className="mx-auto text-blue-500 mb-2" size={24} />
            <h3 className="font-bold text-sm">Frontend</h3>
            <p className="text-xs text-slate-500 mt-1">React 18, Vite, TypeScript, Tailwind CSS</p>
          </Card>
          <Card className="text-center p-4">
            <Database className="mx-auto text-emerald-500 mb-2" size={24} />
            <h3 className="font-bold text-sm">Backend</h3>
            <p className="text-xs text-slate-500 mt-1">FastAPI, Python 3, Pydantic v2</p>
          </Card>
          <Card className="text-center p-4">
            <ShieldCheck className="mx-auto text-indigo-500 mb-2" size={24} />
            <h3 className="font-bold text-sm">Relational DB</h3>
            <p className="text-xs text-slate-500 mt-1">SQLAlchemy ORM, SQLite & PostgreSQL</p>
          </Card>
          <Card className="text-center p-4">
            <Clock className="mx-auto text-amber-500 mb-2" size={24} />
            <h3 className="font-bold text-sm">Fine & Loan Engine</h3>
            <p className="text-xs text-slate-500 mt-1">ACID transactions, 14-day rules, ₹2/day</p>
          </Card>
        </div>
      </div>

      {/* Core Rules & Specifications */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-teal-500" />
          Relational Database Rules Implemented
        </h2>
        <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <Badge variant="info">3NF Schema</Badge>
            <span>Normalized 6 core relational entities: Members, Books, Authors, Categories, Book_Copies, Loans.</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge variant="warning">Two-Loan Quota</Badge>
            <span>A student cannot borrow more than 2 books simultaneously. Enforced at the transactional DB boundary.</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge variant="success">14-Day Cycle</Badge>
            <span>Standard lending period with automatic due date computation and on-time return zero-fine guarantee.</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge variant="danger">Fine Engine</Badge>
            <span>Overdue days calculated per calendar day at ₹2/day for active overdue and past returned books.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
