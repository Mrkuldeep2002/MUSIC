import React from 'react';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <Info className="h-4 w-4 text-brand-cyan" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/80 text-amber-200';
      default:
        return 'border-brand-cyan/40 bg-slate-900/90 text-slate-100';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium ${getBorderColor()}`}>
        {getIcon()}
        <span>{message}</span>
      </div>
    </div>
  );
};
