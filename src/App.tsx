import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Bin } from './types/bin';
import { supabase } from './services/supabaseClient';
import { getBins, subscribeToBinChanges } from './services/binService';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { AnalyticsView } from './components/AnalyticsView';
import { InsightModal } from './components/InsightModal';
import { LoginPage } from './components/LoginPage';
import { playAlarmBeep, unlockAudio } from './utils/audio';
import { Server, ShieldCheck, Trash2, Loader2 } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Theme state: default to 'dark', persist to localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Sync theme to localStorage and HTML root element class
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [bins, setBins] = useState<Bin[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sound alarm state (in-memory, default enabled)
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const isSoundEnabledRef = useRef<boolean>(isSoundEnabled);
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // Edge-trigger ref: tracks binIds that were full in previous round
  const prevFullBinIdsRef = useRef<Set<string>>(new Set());

  // Realtime live mode state (replaces old 10s polling toggle)
  const [isLiveEnabled, setIsLiveEnabled] = useState<boolean>(true);

  // Ref to hold the active realtime channel for cleanup
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Check initial session & subscribe to auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch bins logic
  const fetchBins = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await getBins();
      setBins(data);
      // If modal is open, update the selected bin reference
      setSelectedBin((current) => {
        if (!current) return null;
        const updated = data.find((b) => b.binId === current.binId);
        return updated || current;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch bins only when session exists
  useEffect(() => {
    if (session) {
      fetchBins();
    }
  }, [session, fetchBins]);

  // Realtime subscription — active when session exists and live mode is on
  useEffect(() => {
    if (!session || !isLiveEnabled) return;

    const channel = subscribeToBinChanges(() => {
      fetchBins(true);
    });
    realtimeChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
      realtimeChannelRef.current = null;
    };
  }, [session, isLiveEnabled, fetchBins]);

  // Fallback polling every 60 seconds as a safety net (runs in parallel with Realtime)
  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      fetchBins(true);
    }, 60_000);

    return () => clearInterval(timer);
  }, [session, fetchBins]);

  // Edge-triggered audio alarm: plays beep only when a new bin enters 'full' status
  useEffect(() => {
    if (bins.length === 0) return;

    const currentFullBins = bins.filter((b) => b.binStatus === 'full');
    const currentFullIds = new Set(currentFullBins.map((b) => b.binId));

    // Play beep once if there is at least one newly full bin in this update
    const hasNewlyFullBin = Array.from(currentFullIds).some(
      (id) => !prevFullBinIdsRef.current.has(id)
    );

    if (hasNewlyFullBin && isSoundEnabledRef.current) {
      playAlarmBeep();
    }

    // Record currently full bins for edge detection in subsequent cycles
    prevFullBinIdsRef.current = currentFullIds;
  }, [bins]);

  const handleManualRefresh = () => {
    unlockAudio();
    fetchBins(true);
  };

  const handleToggleLive = () => {
    unlockAudio();
    setIsLiveEnabled((prev) => !prev);
  };

  // Loading state while checking active session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-950 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/25">
            <Trash2 className="w-7 h-7 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in: Show Login Page
  if (!session) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
          });
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        isLiveEnabled={isLiveEnabled}
        onToggleLive={handleToggleLive}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled((prev) => !prev)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'overview' ? (
          <OverviewView
            bins={bins}
            isLoading={isLoading}
            error={error}
            onRefresh={() => fetchBins(false)}
            onOpenInsight={setSelectedBin}
          />
        ) : (
          <AnalyticsView bins={bins} />
        )}
      </main>

      {/* Insight Modal */}
      <InsightModal bin={selectedBin} onClose={() => setSelectedBin(null)} />

      {/* Footer Info */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-sm transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>
              Data Source Layer: <strong className="text-slate-700 dark:text-slate-300 font-mono">binService.ts (Supabase)</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>BinBot IoT Operation Center &bull; เชื่อมต่อ Supabase สำเร็จ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
