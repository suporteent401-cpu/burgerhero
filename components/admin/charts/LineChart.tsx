import React from 'react';

interface LineChartProps {
  data: number[];
  labels: string[];
}

export const LineChart: React.FC<LineChartProps> = ({ data, labels }) => {
  if (!data || data.length === 0) return null;

  const width = 100;
  const height = 50;
  const maxVal = Math.max(...data);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        <polyline points={points} fill="none" stroke="var(--primary-color)" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400 px-2 -mb-5">
        {labels.map(label => <span key={label}>{label}</span>)}
      </div>
    </div>
  );
};