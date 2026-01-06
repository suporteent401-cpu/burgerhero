import React from 'react';
import { LucideProps } from 'lucide-react';

interface InsightCardProps {
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  title: string;
  description: string;
  color: 'amber' | 'blue' | 'purple';
}

export const InsightCard: React.FC<InsightCardProps> = ({ icon: Icon, title, description, color }) => {
  const colors = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  const iconColors = {
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className={`p-4 rounded-xl border flex gap-4 ${colors[color]}`}>
      <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${iconColors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs leading-relaxed opacity-80">{description}</p>
      </div>
    </div>
  );
};