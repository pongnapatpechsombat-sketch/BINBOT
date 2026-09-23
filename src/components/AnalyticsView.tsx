import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Bin, TimeRange, AggregatedFillPoint, FillLevelRecord } from '../types/bin';
import { getFillLevelHistory } from '../services/binService';
import { LoadingState, ErrorState } from './LoadingErrorState';
import {
  TrendingUp,
  Calendar,
  Layers,
  BarChart2,
  Trash2,
  Check,
  Percent,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

function aggregateHistoryData(
  records: FillLevelRecord[],
  range: TimeRange
): AggregatedFillPoint[] {
  const groupedByTime = new Map<string, { [binId: string]: number; count: number; sum: number }>();

  for (const rec of records) {
    const timeKey = rec.timestamp;
    if (!groupedByTime.has(timeKey)) {
      groupedByTime.set(timeKey, { count: 0, sum: 0 });
    }
    const group = groupedByTime.get(timeKey)!;
    group[rec.binId] = rec.fillLevel;
    group.sum += rec.fillLevel;
    group.count += 1;
  }

  // Sort timestamps chronologically
  const sortedTimes = Array.from(groupedByTime.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return sortedTimes.map((timeStr) => {
    const group = groupedByTime.get(timeStr)!;
    const d = new Date(timeStr);

    let displayTime = '';
    if (range === 'today') {
      displayTime = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } else {
      const day = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      const hr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      displayTime = `${day} ${hr}`;
    }

    const averageFill = group.count > 0 ? Math.round((group.sum / group.count) * 10) / 10 : 0;

    const point: AggregatedFillPoint = {
      timestamp: timeStr,
      displayTime,
      averageFill,
      ...group,
    };
    delete (point as Record<string, unknown>).sum;
    delete (point as Record<string, unknown>).count;

    return point;
  });
}

interface AnalyticsViewProps {
  bins: Bin[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ bins }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [chartData, setChartData] = useState<AggregatedFillPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Toggle visibility of specific bin lines in the chart
  const [visibleLines, setVisibleLines] = useState<{ [binId: string]: boolean }>({
    average: true,
    BIN01: true,
    BIN02: true,
    BIN03: true,
    BIN04: true,
  });

  const binColorMap: { [id: string]: { stroke: string; label: string } } = {
    average: { stroke: '#06b6d4', label: 'ค่าเฉลี่ยทุกถัง' },
    BIN01: { stroke: '#10b981', label: 'BIN01 (โซน A)' },
    BIN02: { stroke: '#f59e0b', label: 'BIN02 (โซน B)' },
    BIN03: { stroke: '#8b5cf6', label: 'BIN03 (โซน C)' },
    BIN04: { stroke: '#ef4444', label: 'BIN04 (โซน D)' },
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await getFillLevelHistory(timeRange);
      const aggregated = aggregateHistoryData(records, timeRange);
      setChartData(aggregated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลสถิติและแนวโน้มได้');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Compute key analytics summary metrics
  const analyticsSummary = useMemo(() => {
    if (chartData.length === 0) {
      return {
        currentAvg: 0,
        maxAvg: 0,
        trendDirection: 'stable',
        busiestBin: 'BIN04',
      };
    }

    const currentAvg = chartData[chartData.length - 1]?.averageFill ?? 0;
    const maxAvg = Math.max(...chartData.map((d) => d.averageFill));
    const firstAvg = chartData[0]?.averageFill ?? 0;
    const diff = currentAvg - firstAvg;
    const trendDirection = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable';

    return {
      currentAvg,
      maxAvg,
      trendDirection,
      busiestBin: 'BIN04',
    };
  }, [chartData]);

  const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true;

  return (
    <div className="space-y-6">
      {/* Top Controls: Header & Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">กราฟวิเคราะห์ภาพรวมและแนวโน้มระดับขยะ</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            พล็อตระดับขยะรวมทุกถังแบบอนุกรมเวลาเพื่อตรวจจับวงรอบการใช้งานและการจัดเก็บขยะ
          </p>
        </div>

        {/* Time range selector tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setTimeRange('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              timeRange === 'today'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            วันนี้ (24 ชม.)
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              timeRange === '7d'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            7 วันล่าสุด
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">ระดับเฉลี่ยรวมปัจจุบัน</div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{analyticsSummary.currentAvg}%</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">จุดสูงสุดในช่วงเวลา</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-300">{analyticsSummary.maxAvg}%</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">ถังที่มีการใช้งานหนาแน่น</div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">BIN04 (โซน D)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">แนวโน้มภาพรวม</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {analyticsSummary.trendDirection === 'up' && 'กำลังมีแนวโน้มเพิ่มขึ้น ↗'}
              {analyticsSummary.trendDirection === 'down' && 'กำลังมีแนวโน้มลดลง ↘'}
              {analyticsSummary.trendDirection === 'stable' && 'ระดับทรงตัวปกติ ➔'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              กราฟเปรียบเทียบระดับขยะ ({timeRange === 'today' ? '24 ชั่วโมง' : '7 วันล่าสุด'})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คลิกที่ชื่อถังด้านล่างเพื่อเปิด/ปิดเส้นกราฟของแต่ละใบ
            </p>
          </div>

          {/* Series Toggle Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleLine('average')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                visibleLines.average
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-500/50'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
              {visibleLines.average && <Check className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />}
              เฉลี่ยรวมทุกถัง
            </button>

            {bins.map((b) => {
              const active = visibleLines[b.binId];
              const colorInfo = binColorMap[b.binId] || { stroke: '#94a3b8', label: b.binId };
              return (
                <button
                  key={b.binId}
                  onClick={() => toggleLine(b.binId)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    active
                      ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'
                      : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorInfo.stroke }}
                  />
                  {active && <Check className="w-3 h-3 text-slate-600 dark:text-slate-300" />}
                  {b.binId}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart View with Loading and Error state */}
        {isLoading ? (
          <LoadingState message="กำลังโหลดข้อมูลอนุกรมเวลาและประมวลผลกราฟ..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : chartData.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <p className="text-slate-700 dark:text-slate-300 font-medium">ยังไม่พบข้อมูลอนุกรมเวลาในระบบ</p>
            <p className="text-slate-400 dark:text-slate-500 max-w-md mx-auto">
              (หากเพิ่งสร้างฐานข้อมูลใหม่หรือเริ่มเปิดระบบ ข้อมูลในตาราง <code className="text-cyan-600 dark:text-cyan-400 font-mono">bin_fill_history</code> อาจยังมีน้อยหรือกำลังรอรอบการส่งค่าจากอุปกรณ์ ซึ่งเป็นสภาวะปกติไม่ใช่ข้อผิดพลาดครับ)
            </p>
          </div>
        ) : (
          <div className="h-80 sm:h-96 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 15, right: 20, left: -15, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="avgAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={isDark ? 0.4 : 0.8} />

                <XAxis
                  dataKey="displayTime"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                  dy={10}
                />

                <YAxis
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 70, 95, 100]}
                  tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                  unit="%"
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '10px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => {
                    const label = binColorMap[name ?? '']?.label || name || '';
                    return [`${val ?? 0}%`, label];
                  }}
                  labelFormatter={(label) => `เวลา ${label}`}
                />

                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value: string) => {
                    return (
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {binColorMap[value]?.label || value}
                      </span>
                    );
                  }}
                />

                {/* Average Fill Area and Line */}
                {visibleLines.average && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="averageFill"
                      fill="url(#avgAreaGradient)"
                      stroke="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="averageFill"
                      name="average"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, stroke: '#0891b2', strokeWidth: 2 }}
                    />
                  </>
                )}

                {/* BIN01 Line */}
                {visibleLines.BIN01 && (
                  <Line
                    type="monotone"
                    dataKey="BIN01"
                    name="BIN01"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                )}

                {/* BIN02 Line */}
                {visibleLines.BIN02 && (
                  <Line
                    type="monotone"
                    dataKey="BIN02"
                    name="BIN02"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                )}

                {/* BIN03 Line */}
                {visibleLines.BIN03 && (
                  <Line
                    type="monotone"
                    dataKey="BIN03"
                    name="BIN03"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                )}

                {/* BIN04 Line */}
                {visibleLines.BIN04 && (
                  <Line
                    type="monotone"
                    dataKey="BIN04"
                    name="BIN04"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
