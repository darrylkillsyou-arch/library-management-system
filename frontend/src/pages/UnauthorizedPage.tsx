import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto text-red-600">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-red-600">403</h1>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You do not have administrative privileges to access this area.
        </p>
        <div className="pt-2">
          <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
            Back to Student Portal
          </Button>
        </div>
      </div>
    </div>
  );
}
