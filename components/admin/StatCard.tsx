import React from 'react';
import { LucideProps } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  delta: string;
  tooltip: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, delta, icon: Icon, tooltip }) => {
  const isPositive = delta.startsWith('+');
  const deltaColor = isPositive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  const DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="transition-all hover:border-slate-300 hover:-translate-y-1 overflow-visible relative hover:z-20">
      <CardBody className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-lg">
              <Icon size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-500">{title}</p>
          </div>
          <div className="relative group">
            <Info size={14} className="text-slate-300 cursor-help" />
            <div className="absolute bottom-full mb-2 -right-4 w-48 bg-slate-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              {tooltip}
              <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <h3 className="text-3xl font-black text-slate-800">{value}</h3>
          <div className={`flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-full ${deltaColor}`}>
            <DeltaIcon size={12} strokeWidth={3} /> {delta}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};