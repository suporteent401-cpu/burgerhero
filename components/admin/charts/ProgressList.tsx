import React from 'react';

interface ProgressListProps {
  data: { name: string; percentage: number; color: string }[];
}

export const ProgressList: React.FC<ProgressListProps> = ({ data }) => {
  return (
    <div className="space-y-5">
      {data.map(item => (
        <div key={item.name}>
          <div className="flex justify-between text-sm font-bold mb-1.5 text-slate-600">
            <span>{item.name}</span>
            <span className="text-slate-800">{item.percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.percentage}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};