import React from 'react';
import type { Bin } from '../types/bin';
import { BinSvg } from './BinSvg';
import { DeviceStatusBadge, LedIndicator, LidStatusBadge, BinStatusBadge } from './StatusBadge';
import { BarChart3, Clock, AlertTriangle } from 'lucide-react';

interface BinCardProps {
  bin: Bin;
  onOpenInsight: (bin: Bin) => void;
}

export const BinCard: React.FC<BinCardProps> = ({ bin, onOpenInsight }) => {
  const isFull = bin.binStatus === 'full';
  const isOffline = bin.deviceStatus === 'offline';

  // Dynamic card border, glow, and accent styles based on ledStatus
  const ledStyles = {
    green: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      glow: 'shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]',
      accentBg: 'bg-emerald-500/5',
      badgeBorder: 'border-emerald-500/30',
    },
    yellow: {
      border: 'border-amber-500/40 hover:border-amber-500/70',
      glow: 'shadow-[0_4px_24px_-4px_rgba(245,158,11,0.25)]',
      accentBg: 'bg-amber-500/5',
      badgeBorder: 'border-amber-500/40',
    },
    red: {
      border: 'border-rose-500/50 hover:border-rose-500/80',
      glow: 'shadow-[0_4px_28px_-4px_rgba(239,68,68,0.3)]',
      accentBg: 'bg-rose-500/10',
      badgeBorder: 'border-rose-500/50',
    },
  }[bin.ledStatus];

  // Format last updated time
  const formattedTime = new Date(bin.lastUpdated).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-md p-5 border transition-all duration-300 shadow-sm dark:shadow-none ${
        isFull
          ? 'border-2 border-red-500 ring-2 ring-red-500/50 shadow-2xl animate-pulse-red-glow'
          : bin.lidStatus === 'open'
          ? 'border-2 border-emerald-500/60 ring-2 ring-emerald-500/30 animate-lid-open shadow-lg'
          : `${ledStyles.border} ${ledStyles.glow}`
      } ${isOffline ? 'opacity-85 ring-1 ring-slate-300 dark:ring-slate-700' : ''}`}
    >
      {/* ⚠️ Warning badge มุมบนขวา — แสดงเฉพาะตอนถังเต็ม */}
      {isFull && (
        <div className="absolute -top-3 -right-3 z-10">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 shadow-xl shadow-red-950/40 dark:shadow-red-950/80 animate-pulse" title="ถังขยะเต็มแล้ว!">
            <AlertTriangle className="w-4.5 h-4.5 text-white" />
          </span>
        </div>
      )}
      {/* 1. Header: binName on top */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                {bin.binId}
              </span>
              <DeviceStatusBadge status={bin.deviceStatus} />
            </div>
            <h3 className="mt-1.5 text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-1" title={bin.binName}>
              {bin.binName}
            </h3>
          </div>
          <LedIndicator status={bin.ledStatus} size="md" />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <BinStatusBadge status={bin.binStatus} />
          <LidStatusBadge status={bin.lidStatus} isLockedFull={isFull} />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {bin.binSizeLiters} ลิตร
          </span>
        </div>
      </div>

      {/* 2. Visual Trash Bin SVG with Fill Level & Centered % */}
      <div className="my-2 py-2 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/80">
        <BinSvg
          fillLevel={bin.fillLevel}
          ledStatus={bin.ledStatus}
          lidStatus={bin.lidStatus}
          className="w-36 h-48"
        />

        {/* Lock warning if full */}
        {isFull && (
          <div className="mt-1 px-3 py-1 bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950/90 dark:border-rose-500/50 dark:text-rose-300 text-xs font-medium rounded-full flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>ขยะเต็ม (ล็อกฝา ห้ามทิ้งเพิ่ม)</span>
          </div>
        )}

        {/* Active open lid alert when not full */}
        {bin.lidStatus === 'open' && !isFull && (
          <div className="mt-1 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-500/50 dark:text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1.5 animate-lid-open">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>กำลังเปิดฝา (ทิ้งขยะสดๆ)</span>
          </div>
        )}
      </div>

      {/* 3. Bottom Section: Lid Status & Insight Button */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        {/* Lid Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">สถานะฝาถัง:</span>
          <LidStatusBadge status={bin.lidStatus} isLockedFull={isFull} />
        </div>

        {/* Today's Stats Snippet */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-200 dark:border-slate-700/50">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">เปิดฝาวันนี้</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{bin.lidOpenCountToday} ครั้ง</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-200 dark:border-slate-700/50">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">จำนวนครั้งที่เต็ม</div>
            <div className={`text-sm font-semibold ${bin.fullEventCountToday > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {bin.fullEventCountToday} ครั้ง
            </div>
          </div>
        </div>

        {/* Footer actions & Last updated */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1" title="เวลาอัปเดตล่าสุด">
            <Clock className="w-3 h-3 text-slate-400" />
            {formattedTime}
          </span>
          <button
            onClick={() => onOpenInsight(bin)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-cyan-700 hover:text-cyan-800 border border-slate-200 hover:border-cyan-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-400 dark:hover:text-cyan-300 dark:border-slate-700 dark:hover:border-cyan-500/40 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            ดูข้อมูลเชิงลึก
          </button>
        </div>
      </div>
    </div>
  );
};
