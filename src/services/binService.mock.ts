import type {
  Bin,
  BinEvent,
  FillLevelRecord,
  AggregatedFillPoint,
  TimeRange,
} from '../types/bin';

// Base URL configured via environment variable
// In mock mode: '/mock' (reads static files from /public/mock/)
// In live API mode: e.g. 'https://api.binbot.iot/v1' or 'http://localhost:8000/api'
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/mock').replace(/\/$/, '');
const IS_MOCK = BASE_URL.endsWith('/mock') || BASE_URL === '/mock';

/**
 * Enforce Core IoT Business Logic Rules:
 * - >= 95%: Full, Red LED, Lid closed (Locked)
 * - 70 - 94%: Warning, Yellow LED
 * - < 70%: Normal, Green LED
 */
export function applyBusinessLogic(bin: Bin): Bin {
  const fill = Math.round(bin.fillLevel);
  let binStatus = bin.binStatus;
  let ledStatus = bin.ledStatus;
  let lidStatus = bin.lidStatus;

  if (fill >= 95) {
    binStatus = 'full';
    ledStatus = 'red';
    lidStatus = 'closed'; // Lid cannot remain open when full
  } else if (fill >= 70) {
    binStatus = 'warning';
    ledStatus = 'yellow';
  } else {
    binStatus = 'normal';
    ledStatus = 'green';
  }

  return {
    ...bin,
    fillLevel: fill,
    binStatus,
    ledStatus,
    lidStatus,
  };
}

/**
 * Fetch all trash bins snapshot
 */
export async function getBins(): Promise<Bin[]> {
  const url = IS_MOCK ? `${BASE_URL}/bins_current.json?t=${Date.now()}` : `${BASE_URL}/bins`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลถังขยะได้ (HTTP ${response.status})`);
  }
  const rawBins: Bin[] = await response.json();
  return rawBins.map(applyBusinessLogic);
}

/**
 * Fetch details for a specific bin
 */
export async function getBinById(binId: string): Promise<Bin | null> {
  if (IS_MOCK) {
    const allBins = await getBins();
    const found = allBins.find((b) => b.binId === binId);
    return found ? applyBusinessLogic(found) : null;
  }
  const url = `${BASE_URL}/bins/${encodeURIComponent(binId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`ไม่สามารถดึงข้อมูลถัง ${binId} ได้ (HTTP ${response.status})`);
  }
  const rawBin: Bin = await response.json();
  return applyBusinessLogic(rawBin);
}

/**
 * Fetch event log (from events_log.jsonl in mock mode, or /bins/events in live API)
 */
export async function getBinEvents(binId?: string): Promise<BinEvent[]> {
  if (IS_MOCK) {
    const url = `${BASE_URL}/events_log.jsonl?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ไม่สามารถดึงประวัติเหตุการณ์ได้ (HTTP ${response.status})`);
    }
    const text = await response.text();
    const lines = text.split('\n').filter((line) => line.trim().length > 0);
    const events: BinEvent[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as BinEvent;
        if (!binId || parsed.binId === binId) {
          events.push(parsed);
        }
      } catch (err) {
        console.warn('Skipping invalid JSONL event line:', line, err);
      }
    }

    // Sort newest first
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  const query = binId ? `?binId=${encodeURIComponent(binId)}` : '';
  const url = `${BASE_URL}/bins/events${query}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงประวัติเหตุการณ์ได้ (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch fill level time-series history
 */
export async function getFillLevelHistory(range: TimeRange = 'today'): Promise<FillLevelRecord[]> {
  if (IS_MOCK) {
    const url = `${BASE_URL}/fill_level_history.csv?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ไม่สามารถดึงข้อมูลอนุกรมเวลาได้ (HTTP ${response.status})`);
    }
    const csvText = await response.text();
    const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    
    // Skip header line
    const dataLines = lines.slice(1);
    const records: FillLevelRecord[] = [];

    for (const line of dataLines) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const timestamp = parts[0].trim();
        const binId = parts[1].trim();
        const fillLevel = parseFloat(parts[2].trim());
        if (!isNaN(fillLevel)) {
          records.push({ timestamp, binId, fillLevel });
        }
      }
    }

    // Filter by time range
    if (records.length === 0) return [];

    // Find the latest timestamp in data to calculate relative time window
    const timestamps = records.map((r) => new Date(r.timestamp).getTime());
    const maxTime = Math.max(...timestamps);

    const cutoffHours = range === 'today' ? 24 : 7 * 24;
    const cutoffTime = maxTime - cutoffHours * 60 * 60 * 1000;

    return records.filter((r) => new Date(r.timestamp).getTime() >= cutoffTime);
  }

  const url = `${BASE_URL}/bins/fill-history?range=${range}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงประวัติกราฟระดับขยะได้ (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Helper to aggregate multi-bin history for Recharts visualization
 */
export function aggregateHistoryData(
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
