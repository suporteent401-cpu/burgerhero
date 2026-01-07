import React from 'react';
import { useNavigate }from 'react-router-dom';
import { Card, CardBody } from './ui/Card';
import { Button } from './ui/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-red-500/20">
        <CardBody className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Ocorreu um Erro Inesperado</h1>
          <p className="text-slate-500 mb-6">Nossa equipe de heróis já foi notificada. Tente recarregar a página ou voltar ao início.</p>
          
          <details className="w-full bg-slate-50 p-3 rounded-lg text-left mb-6">
            <summary className="font-bold text-sm cursor-pointer">Detalhes Técnicos</summary>
            <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap break-all">
              {error.message}
            </pre>
          </details>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home size={16} className="mr-2" /> Voltar ao Início
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw size={16} className="mr-2" /> Recarregar
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ErrorFallback;