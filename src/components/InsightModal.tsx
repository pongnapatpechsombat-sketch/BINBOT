import React, { useEffect, useState } from 'react';
import type { Bin, BinEvent, FillLevelRecord } from '../types/bin';
import { getRecentEvents, getFillLevelHistory } from '../services/binService';
import { BinSvg } from './BinSvg';
import { DeviceStatusBadge, LedIndicator, LidStatusBadge, BinStatusBadge } from './StatusBadge';
import {
  X,
  Clock,
  Trash2,
  Activity,
  History,
  AlertOctagon,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface InsightModalProps {
  bin: Bin | null;
  onClose: () => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({ bin, onClose }) => {
  const [events, setEvents] = useState<BinEvent[]>([]);
  const [history, setHistory] = useState<FillLevelRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bin) return;

    let isMounted = true;
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [evs, hist] = await Promise.all([
          getRecentEvents(bin.binId, 20),
          getFillLevelHistory('today', bin.binId),
        ]);
        if (isMounted) {
          setEvents(evs);
          setHistory(hist);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลเชิงลึก');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetails();

    // Close on Esc key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [bin, onClose]);

  if (!bin) return null;

  const isFull = bin.binStatus === 'full';
  const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true;

  // Format event type to Thai
  const formatEventType = (type: BinEvent['eventType'], value?: unknown) => {
    switch (type) {
      case 'lid_open':
        return { label: 'เปิดฝาถังทิ้งขยะ', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' };
      case 'lid_close':
        return { label: 'ปิดฝาถังสนิท', color: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700' };
      case 'full_event_start':
        return {
          label: `ขยะเต็มเกิน 95% (ค่าจริง ${value ?? 95}%)`,
          color: 'text-rose-700 bg-rose-50 border-rose-300 font-semibold dark:text-rose-400 dark:bg-rose-500/15 dark:border-rose-500/30',
        };
      case 'full_event_end':
        return {
          label: `เก็บขยะเรียบร้อย ระดับลดเหลือ ${value ?? '< 95'}%`,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-500/15 dark:border-emerald-500/30',
        };
      case 'device_offline':
        return { label: 'อุปกรณ์ขาดการเชื่อมต่อ (Offline)', color: 'text-rose-700 bg-rose-50 border-rose-300 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800' };
      case 'device_online':
        return { label: 'อุปกรณ์เชื่อมต่อกลับมา (Online)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800' };
      default:
        return { label: String(type), color: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800' };
    }
  };

  const chartData = history.map((h) => {
    const d = new Date(h.timestamp);
    return {
      time: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      fillLevel: h.fillLevel,
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl p-6 text-slate-800 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-400 dark:border-cyan-800">
                {bin.binId}
              </span>
              <DeviceStatusBadge status={bin.deviceStatus} />
              <LedIndicator status={bin.ledStatus} size="sm" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{bin.binName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              อัปเดตล่าสุด:{' '}
              {new Date(bin.lastUpdated).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'medium',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
          {/* Visual SVG Bin */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <BinSvg
              fillLevel={bin.fillLevel}
              ledStatus={bin.ledStatus}
              lidStatus={bin.lidStatus}
              className="w-32 h-44"
            />
            <div className="mt-2 text-center">
              <BinStatusBadge status={bin.binStatus} />
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                สถานะฝา: <LidStatusBadge status={bin.lidStatus} isLockedFull={isFull} />
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            {/* Metric 1: Size */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Trash2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>ขนาดความจุถัง</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{bin.binSizeLiters} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ลิตร</span></div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ปริมาตรขยะปัจจุบันประมาณ {Math.round((bin.fillLevel / 100) * bin.binSizeLiters)} ลิตร</div>
              </div>
            </div>

            {/* Metric 2: Open frequency today */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>เปิดฝาจริงวันนี้</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{bin.lidOpenCountToday} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ครั้ง/วัน</span></div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">เฉพาะคำสั่ง Servo เปิดจริง</div>
              </div>
            </div>

            {/* Metric 3: Full event count */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>ขยะเต็มวันนี้ (Edge-trigger)</span>
              </div>
              <div className="mt-2">
                <div className={`text-2xl font-bold ${bin.fullEventCountToday > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {bin.fullEventCountToday} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ครั้ง/วัน</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">นับเฉพาะตอนข้าม 95% ครั้งแรก</div>
              </div>
            </div>

            {/* Metric 4: Device Health */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>สถานะฮาร์ดแวร์ ESP32</span>
              </div>
              <div className="mt-2">
                <div className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <DeviceStatusBadge status={bin.deviceStatus} />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {bin.deviceStatus === 'online' ? 'สัญญาณปกติ รับส่งข้อมูลเรียลไทม์' : 'ขาดการเชื่อมต่อ กำลังรอส่งสัญญาณ'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 24-hour Trendline for this Bin */}
        <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            แนวโน้มระดับขยะย้อนหลัง 24 ชม. ของถังนี้
          </h4>
          {chartData.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="binFillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={isDark ? 0.5 : 0.8} />
                  <XAxis dataKey="time" stroke={isDark ? '#64748b' : '#94a3b8'} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} domain={[0, 100]} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '8px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.2)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val ?? 0}%`, 'ระดับขยะ']}
                    labelFormatter={(label) => `เวลา ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="fillLevel"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#binFillGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">ยังไม่มีข้อมูลแนวโน้ม 24 ชม.</div>
          )}
        </div>

        {/* Event Logs Timeline */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              บันทึกเหตุการณ์ล่าสุด (Events Log)
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">อ้างอิงจาก Supabase (bin_events)</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-xs text-slate-500 dark:text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
              กำลังโหลดบันทึกเหตุการณ์...
            </div>
          ) : error ? (
            <div className="text-xs text-rose-600 dark:text-rose-400 p-3 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
              ไม่มีบันทึกเหตุการณ์ในระบบสำหรับถังใบนี้
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {events.map((ev, idx) => {
                const style = formatEventType(ev.eventType, ev.value);
                const evTime = new Date(ev.timestamp).toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{evTime}</span>
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${style.color}`}>
                        {style.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{ev.eventType}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
