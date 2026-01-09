import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { QrCode, Award, UserCheck, Loader2 } from 'lucide-react';
import { staffService } from '../services/staff.service';

const StaffHome: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [shiftCount, setShiftCount] = useState<number | null>(null);

  useEffect(() => {
    staffService.getShiftRedemptionsCount()
      .then(setShiftCount)
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Painel do Colaborador</h2>
        <p className="text-slate-500 dark:text-slate-400">Bem-vindo, {user?.name.split(' ')[0]}!</p>
      </div>

      <Card>
        <CardBody className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-hero-primary/10 rounded-full flex items-center justify-center text-hero-primary">
            <UserCheck size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pronto para validar?</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Use o leitor de QR Code para validar os vouchers dos nossos heróis de forma rápida e segura.
          </p>
          <Link to="/staff/validate" className="w-full">
            <Button size="lg" className="w-full">
              <QrCode size={20} className="mr-2" /> Escanear QR Code
            </Button>
          </Link>
        </CardBody>
      </Card>

      <Card className="bg-slate-900 text-white">
        <CardBody className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award size={20} className="text-hero-primary" />
            <span className="font-bold text-sm">Resgates no Turno</span>
          </div>
          <span className="text-2xl font-black tracking-tighter">
            {shiftCount === null ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              shiftCount
            )}
          </span>
        </CardBody>
      </Card>
    </div>
  );
};

export default StaffHome;