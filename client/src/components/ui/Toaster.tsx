import React from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: 'border-green-800/60 bg-green-950/80 text-green-300',
  warning: 'border-amber-800/60 bg-amber-950/80 text-amber-300',
  error: 'border-red-800/60 bg-red-950/80 text-red-300',
  info: 'border-blue-800/60 bg-blue-950/80 text-blue-300',
};

export const Toaster: React.FC<ToasterProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-xl pointer-events-auto animate-in slide-in-from-right-4 ${COLORS[toast.type]}`}
            style={{ animation: 'slideInFromRight 0.3s ease' }}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
