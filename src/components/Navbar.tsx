import React, { useState, useEffect } from 'react';
import {
  Trash2,
  LayoutGrid,
  BarChart3,
  RefreshCw,
  Pause,
  Play,
  Cpu,
  LogOut,
  Radio,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { testAlarmSound, unlockAudio } from '../utils/audio';

interface NavbarProps {
  activeTab: 'overview' | 'analytics';
  onTabChange: (tab: 'overview' | 'analytics') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  /** true = Realtime subscription กำลังทำงานอยู่ */
  isLiveEnabled: boolean;
  onToggleLive: () => void;
  /** true = เสียงแจ้งเตือนเปิดอยู่ */
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  /** สถานะธีมปัจจุบัน */
  theme: 'light' | 'dark';
  /** ฟังก์ชันสลับธีม */
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  isLiveEnabled,
  onToggleLive,
  isSoundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการออกจากระบบ:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & System Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/20">
              <Trash2 className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white m-0">BinBot</h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60 font-semibold">
                  IoT Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                ระบบมอนิเตอร์ถังขยะอัจฉริยะแบบรวมศูนย์
              </p>
            </div>
          </div>

          {/* Mobile Current Time */}
          <div className="md:hidden text-right">
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{currentTime}</span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 self-start md:self-auto">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-cyan-400 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            หน้าหลัก (ภาพรวม)
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-cyan-400 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            กราฟภาพรวม (Analytics)
          </button>
        </div>

        {/* Right: Live Clock & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Live Clock (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{currentTime}</span>
          </div>

          {/* Realtime Status & Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/80 p-1 pl-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            {/* Live Status Indicator */}
            <div className="text-[11px] flex items-center gap-1.5 mr-1">
              {isLiveEnabled ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-700 dark:text-emerald-300 font-medium">เชื่อมต่อสด (Live)</span>
                  <span className="sm:hidden text-emerald-600 dark:text-emerald-400 font-mono font-bold">Live</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                  <span className="hidden sm:inline text-slate-500 dark:text-slate-400">หยุดรับข้อมูลสด</span>
                  <span className="sm:hidden text-slate-500 font-mono">Paused</span>
                </>
              )}
            </div>

            {/* Toggle Live Button */}
            <button
              onClick={onToggleLive}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isLiveEnabled ? 'คลิกเพื่อหยุดรับข้อมูลสด' : 'คลิกเพื่อเปิดรับข้อมูลสดอีกครั้ง'}
            >
              {isLiveEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-cyan-400 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูลทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Sound Toggle Button & Test Sound */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => {
                unlockAudio();
                if (!isSoundEnabled) {
                  testAlarmSound();
                }
                onToggleSound();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs font-medium cursor-pointer ${
                isSoundEnabled
                  ? 'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200/70 dark:bg-cyan-950/60 dark:text-cyan-400 dark:border-cyan-800/60 dark:hover:bg-cyan-900/60 dark:hover:text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200/60 hover:text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-300'
              }`}
              title={isSoundEnabled ? 'เปิดเสียง Alarm อยู่ (คลิกเพื่อปิดเสียง)' : 'ปิดเสียง Alarm อยู่ (คลิกเพื่อเปิดเสียง)'}
              aria-label={isSoundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
            >
              {isSoundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline text-[11px] font-medium">เปิดเสียง</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="hidden sm:inline text-[11px] font-medium">ปิดเสียง</span>
                </>
              )}
            </button>

            {isSoundEnabled && (
              <button
                onClick={() => {
                  unlockAudio();
                  testAlarmSound();
                }}
                className="px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-cyan-700 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-cyan-300 dark:hover:bg-slate-800 transition cursor-pointer"
                title="คลิกเพื่อทดสอบเสียงแจ้งเตือน (Test Beep)"
              >
                ลองเสียง
              </button>
            )}
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-amber-300 dark:border-slate-800/80 transition text-xs font-medium cursor-pointer shadow-sm"
            title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
            aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline text-[11px] font-medium">โหมดสว่าง</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline text-[11px] font-medium">โหมดมืด</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-300 dark:bg-slate-950/80 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-300 dark:border-slate-800/80 dark:hover:border-rose-800/60 transition text-xs font-medium cursor-pointer disabled:opacity-50 shadow-sm"
            title="ออกจากระบบ"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
