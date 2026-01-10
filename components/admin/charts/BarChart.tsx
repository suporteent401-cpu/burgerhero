import React from 'react';

interface BarChartProps {
  data: number[];
  labels: string[];
}

export const BarChart: React.FC<BarChartProps> = ({ data, labels }) => {
  const rawMax = Math.max(...data);
  // Garante que o divisor nunca seja zero
  const maxVal = rawMax > 0 ? rawMax : 1;

  return (
    <div>
      <div className="h-48 flex items-end gap-3 pb-2 border-b border-slate-100">
        {data.map((val, i) => (
          <div key={i} className="flex-1 group relative flex flex-col justify-end h-full">
            {/* Barra */}
            <div 
              className="bg-hero-primary/20 group-hover:bg-hero-primary rounded-t-lg transition-all duration-300 cursor-pointer w-full relative" 
              style={{ 
                height: `${val > 0 ? (val / maxVal) * 100 : 2}%`, // Mínimo de 2% para visualização de "zero"
                opacity: val > 0 ? 1 : 0.3 
              }}
            >
              {/* Tooltip flutuante */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                {val}
                {/* Seta do tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
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