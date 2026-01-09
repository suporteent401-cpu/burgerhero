import React from 'react';

interface LineChartProps {
  data: number[];
  labels: string[];
}

export const LineChart: React.FC<LineChartProps> = ({ data, labels }) => {
  // 1. Sanitização: Garante que o array existe e transforma valores inválidos em 0
  const sanitizedData = (data || []).map(v => (typeof v === 'number' && Number.isFinite(v) ? v : 0));

  // Se não houver dados, não renderiza nada
  if (sanitizedData.length === 0) return null;

  const width = 100;
  const height = 50;

  // 2. Cálculo do valor máximo com fallback para evitar divisão por zero
  const rawMax = Math.max(...sanitizedData, 0);
  const maxVal = rawMax <= 0 ? 1 : rawMax;

  // 3. Geração robusta dos pontos da linha
  // Se houver apenas 1 ponto, centralizamos ele no eixo X (width / 2)
  const points = sanitizedData.map((val, i) => {
    const x = sanitizedData.length > 1
      ? (i / (sanitizedData.length - 1)) * width
      : width / 2;
    const y = height - (val / maxVal) * height;
    
    // Usamos toFixed para garantir que a string enviada ao SVG seja puramente numérica
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  // 4. Geração dos pontos da área (fechamento do polígono na base do gráfico)
  const lastX = sanitizedData.length > 1 ? width : width / 2;
  const firstX = sanitizedData.length > 1 ? 0 : width / 2;
  const areaPoints = `${points} ${lastX.toFixed(2)},${height} ${firstX.toFixed(2)},${height}`;

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Camada de Preenchimento (Gradiente) */}
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        
        {/* Camada da Linha */}
        <polyline 
          points={points} 
          fill="none" 
          stroke="var(--primary-color)" 
          strokeWidth="1.5" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
      </svg>
      
      {/* Labels do Eixo X */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400 px-2 -mb-5">
        {labels && labels.map((label, i) => (
          <span key={`${label}-${i}`}>{label}</span>
        ))}
      </div>
    </div>
  );
};