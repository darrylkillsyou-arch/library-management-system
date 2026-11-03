import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <HelpCircle size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-[#1a266f] dark:text-teal-400">404</h1>
        <h2 className="text-xl font-bold">Page Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The requested page could not be located in the LibraNest system.
        </p>
        <div className="pt-2">
          <Button variant="primary" onClick={() => navigate('/')}>
            Return to Safety
          </Button>
        </div>
      </div>
    </div>
  );
}
