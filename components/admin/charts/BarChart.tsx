import React from 'react';

interface BarChartProps {
  data: number[];
  labels: string[];
}

export const BarChart: React.FC<BarChartProps> = ({ data, labels }) => {
  const maxVal = Math.max(...data);

  return (
    <div>
      <div className="h-48 flex items-end gap-3">
        {data.map((val, i) => (
          <div key={i} className="flex-1 group relative">
            <div 
              className="bg-hero-primary/20 hover:bg-hero-primary rounded-t-lg transition-colors cursor-pointer" 
              style={{ height: `${(val / maxVal) * 100}%` }}
            ></div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {val}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-[10px] font-black uppercase text-slate-400">
        {labels.map(label => <span key={label}>{label}</span>)}
      </div>
    </div>
  );
};