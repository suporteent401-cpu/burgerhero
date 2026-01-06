
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input 
          className={`
            w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 
            focus:border-hero-primary focus:ring-0 outline-none transition-all
            placeholder:text-slate-400 text-slate-800
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-red-500 bg-red-50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
};
