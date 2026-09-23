import React from 'react';
import type { BinStatus, DeviceStatus, LedStatus, LidStatus } from '../types/bin';
import { CheckCircle2, AlertTriangle, AlertOctagon, Wifi, WifiOff, Lock, Unlock } from 'lucide-react';

export const BinStatusBadge: React.FC<{ status: BinStatus }> = ({ status }) => {
  switch (status) {
    case 'normal':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          ปกติ (&lt; 70%)
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          เตือนใกล้เต็ม (70-94%)
        </span>
      );
    case 'full':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-500/30 animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5" />
          ขยะเต็ม (≥ 95%)
        </span>
      );
  }
};

export const LedIndicator: React.FC<{ status: LedStatus; size?: 'sm' | 'md' | 'lg' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const colorStyles = {
    green: 'bg-emerald-500 shadow-[0_0_10px_#10b981]',
    yellow: 'bg-amber-500 shadow-[0_0_10px_#f59e0b]',
    red: 'bg-rose-500 shadow-[0_0_12px_#ef4444]',
  }[status];

  const label = {
    green: 'LED เขียว',
    yellow: 'LED เหลือง',
    red: 'LED แดง',
  }[status];

  return (
    <div className="flex items-center gap-2" title={`สถานะไฟ LED: ${label}`}>
      <span className={`rounded-full ${sizeClasses} ${colorStyles}`} />
      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</span>
    </div>
  );
};

export const DeviceStatusBadge: React.FC<{ status: DeviceStatus }> = ({ status }) => {
  if (status === 'online') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
        <Wifi className="w-3 h-3" />
        ออนไลน์
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
      <WifiOff className="w-3 h-3" />
      ออฟไลน์
    </span>
  );
};

export const LidStatusBadge: React.FC<{ status: LidStatus; isLockedFull?: boolean }> = ({
  status,
  isLockedFull = false,
}) => {
  // เมื่อ lidStatus === 'open': กำลังเปิดฝา... พร้อม animation
  if (status === 'open') {
    return (
      <span className="animate-lid-open inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-400/80 shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/50">
        <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        กำลังเปิดฝา...
      </span>
    );
  }

  // เมื่อ binStatus === 'full' และ lidStatus === 'closed' (กรณีฝาถูกล็อกเพราะถังเต็ม)
  if (isLockedFull) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40">
        <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        ฝาล็อก (ถังเต็ม)
      </span>
    );
  }

  // เมื่อ lidStatus === 'closed' (สถานะปกติ นิ่ง ไม่ต้องมี animation)
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      ฝาปิดเรียบร้อย
    </span>
  );
};
