import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';

const Debug: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const isAuthed = useAuthStore(state => state.isAuthed);
  const heroTheme = useThemeStore(state => state.heroTheme);
  const mode = useThemeStore(state => state.mode);
  const location = useLocation();

  const data = {
    currentPath: location.pathname,
    isAuthed,
    user: user ? {
      id: user.id,
      name: user.name,
      role: user.role,
      code: user.customerCode,
      theme: user.heroTheme
    } : null,
    systemTheme: {
      mode,
      heroTheme
    }
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-green-400 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="animate-pulse">●</span> BURGER HERO DEBUG CONSOLE
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-black/50 border-green-500/30 text-green-400">
          <CardBody>
             <h2 className="font-black text-xs uppercase mb-4 border-b border-green-500/20 pb-2 tracking-widest">Estado da Aplicação</h2>
             <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card className="bg-black/50 border-green-500/30 text-green-400">
            <CardBody>
               <h2 className="font-black text-xs uppercase mb-4 border-b border-green-500/20 pb-2 tracking-widest">Navegação Direta</h2>
               <div className="grid grid-cols-2 gap-2">
                  <Link to="/" className="p-2 border border-green-500/20 hover:bg-green-500/10 rounded">/ Landing</Link>
                  <Link to="/auth" className="p-2 border border-green-500/20 hover:bg-green-500/10 rounded">/ Auth</Link>
                  <Link to="/app" className="p-2 border border-green-500/20 hover:bg-green-500/10 rounded">/ Cliente Home</Link>
                  <Link to="/admin" className="p-2 border border-green-500/20 hover:bg-green-500/10 rounded">/ Admin Panel</Link>
                  <Link to="/staff/validate" className="p-2 border border-green-500/20 hover:bg-green-500/10 rounded">/ Staff Validate</Link>
                  <Link to="/plans" className="p-2 border border-green-500/20 hover:bg-green-500/10 rounded">/ Plans</Link>
               </div>
            </CardBody>
          </Card>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
            <strong>Dica:</strong> Em caso de erro 403, verifique se seu cargo (Role) no Zustand bate com a rota protegida.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug;