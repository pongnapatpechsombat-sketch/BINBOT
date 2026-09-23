import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'กำลังโหลดข้อมูลจากระบบ BinBot...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-cyan-500/80 animate-ping" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">{message}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">กำลังเชื่อมต่อกับ Service Layer...</p>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'เกิดข้อผิดพลาดในการดึงข้อมูล',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-300/90 dark:bg-rose-950/40 dark:border-rose-900/50 px-3 py-2 rounded-lg mt-2 font-mono">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  );
};
