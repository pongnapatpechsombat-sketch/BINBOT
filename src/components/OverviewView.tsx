import React from 'react';
import type { Bin } from '../types/bin';
import { BinCard } from './BinCard';
import { LoadingState, ErrorState } from './LoadingErrorState';
import {
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  WifiOff,
  Radio,
} from 'lucide-react';

interface OverviewViewProps {
  bins: Bin[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenInsight: (bin: Bin) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  bins,
  isLoading,
  error,
  onRefresh,
  onOpenInsight,
}) => {
  // Statistics calculations
  const totalCount = bins.length;
  const normalCount = bins.filter((b) => b.binStatus === 'normal').length;
  const warningCount = bins.filter((b) => b.binStatus === 'warning').length;
  const fullCount = bins.filter((b) => b.binStatus === 'full').length;
  const offlineCount = bins.filter((b) => b.deviceStatus === 'offline').length;

  // Urgent attention bins
  const urgentBins = bins.filter((b) => b.binStatus === 'full' || b.deviceStatus === 'offline');

  // Bins with lid currently open (กำลังใช้งานอยู่)
  const openLidBins = bins.filter((b) => b.lidStatus === 'open');

  // Bins that are full (for sticky banner)
  const fullBins = bins.filter((b) => b.binStatus === 'full');
  const offlineBins = bins.filter((b) => b.deviceStatus === 'offline');

  if (isLoading && bins.length === 0) {
    return <LoadingState message="กำลังดึงสถานะถังขยะอัจฉริยะแบบเรียลไทม์..." />;
  }

  if (error && bins.length === 0) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div className="space-y-6">
      {/* === Sticky Urgent Operator Banner — ถังเต็ม/ออฟไลน์ === */}
      {urgentBins.length > 0 && (
        <div className="sticky top-[64px] md:top-[68px] z-30 -mx-4 lg:-mx-8 px-4 lg:px-8 -mt-2">
          <div className="py-3 px-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-b-2 border-red-500 rounded-xl shadow-2xl shadow-red-950/30 dark:shadow-red-950/70 flex items-center gap-3 text-white">
            <AlertOctagon className="w-5 h-5 text-white shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0 space-y-1">
              {fullBins.length > 0 && (
                <p className="text-sm font-bold text-white leading-snug">
                  ⚠️ {fullBins.map((b) => `${b.binName} (${b.binId})`).join(', ')} เต็มแล้ว กรุณาไปเทขยะ
                </p>
              )}
              {offlineBins.length > 0 && (
                <p className="text-xs text-red-100 font-medium leading-snug">
                  📵 {offlineBins.map((b) => `${b.binName} (${b.binId})`).join(', ')} ออฟไลน์ — กรุณาตรวจสอบแบตเตอรี่/เครือข่าย
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Total */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">ถังทั้งหมด</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalCount} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ใบ</span></div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Trash2 className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Normal */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">ปกติ (&lt; 70%)</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{normalCount} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ใบ</span></div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Warning */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">เตือน (70-94%)</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{warningCount} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ใบ</span></div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Full */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">เต็ม (≥ 95%)</div>
            <div className={`text-2xl font-bold mt-1 ${fullCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {fullCount} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ใบ</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        {/* Card 5: Offline */}
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">ออฟไลน์</div>
            <div className={`text-2xl font-bold mt-1 ${offlineCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {offlineCount} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">จุด</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <WifiOff className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Grid of All Trash Bins */}
      <div>
        {/* === Active Lid Banner — กำลังใช้งานอยู่ (แสดงเฉพาะเมื่อมีถังเปิดอยู่) === */}
        {openLidBins.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {openLidBins.map((b) => (
              <div
                key={b.binId}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200 shadow-md shadow-emerald-500/10 dark:shadow-emerald-950/40 animate-lid-open"
              >
                <span className="text-sm shrink-0">🟢</span>
                <span className="text-xs sm:text-sm font-medium">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">กำลังมีการทิ้งขยะที่</span>{' '}
                  <span className="text-slate-900 dark:text-white font-semibold">{b.binName}</span>{' '}
                  <span className="font-mono text-emerald-600 dark:text-emerald-400/90 font-semibold">({b.binId})</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              สถานะถังขยะรายจุด (Monitoring Grid)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            แสดงผลทั้งหมด {bins.length} จุดติดตั้ง
          </span>
        </div>

        {bins.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
            <Radio className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto animate-pulse" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              เชื่อมต่อ Supabase สำเร็จ &bull; กำลังรอรับข้อมูล Snapshot จากอุปกรณ์
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              วิว <code className="text-cyan-700 dark:text-cyan-400 font-mono">bin_dashboard</code> ยังไม่มีรายการข้อมูล เมื่อฮาร์ดแวร์ ESP32 เริ่มส่งข้อมูลเข้าตาราง <code className="text-cyan-700 dark:text-cyan-400 font-mono">bin_snapshots</code> การ์ดถังขยะจะแสดงผลขึ้นที่นี่โดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {bins.map((bin) => (
              <BinCard key={bin.binId} bin={bin} onOpenInsight={onOpenInsight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
