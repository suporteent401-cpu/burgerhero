import React from 'react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 border-b border-slate-50 dark:border-slate-800 ${className}`}>{children}</div>
);

export const CardBody: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 text-slate-800 dark:text-slate-100 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800 ${className}`}>{children}</div>
);