import { supabase } from './supabaseClient';
import type { Bin, FillLevelRecord, BinEvent, BinStatus, LedStatus, LidStatus, DeviceStatus, EventType } from '../types/bin';

// ============================================================
// binService.ts — ชั้น Data-fetching ที่ UI Component เรียกใช้
// เดิมอ่านจาก mock file, ตอนนี้เปลี่ยนมาต่อ Supabase จริง
// Signature ของทุกฟังก์ชัน (ชื่อ, พารามิเตอร์, shape ข้อมูลที่ return)
// ยังเหมือนเดิมทุกอย่าง เพื่อไม่ให้ต้องแก้ Component ใดๆ เลย
// ============================================================

// แปลงแถวจาก view bin_dashboard (snake_case) ให้เป็น Bin interface (camelCase)
// ที่ Component ทุกตัวใช้งานอยู่แล้ว
function mapRowToBin(row: any): Bin {
  const rawLid = String(row.lid_status || '').toLowerCase().trim();
  const isOpen = rawLid === 'open' || rawLid === 'opened' || rawLid === '1' || row.lid_status === true;
  const lidStatus: LidStatus = isOpen ? 'open' : 'closed';

  const fillLevel = Number(row.fill_percent ?? 0);
  const rawBinStatus = String(row.bin_status || '').toLowerCase().trim();
  let binStatus: BinStatus = 'normal';
  if (rawBinStatus === 'full' || fillLevel >= 95) {
    binStatus = 'full';
  } else if (rawBinStatus === 'warning' || fillLevel >= 70) {
    binStatus = 'warning';
  }

  const rawLedStatus = String(row.led_status || '').toLowerCase().trim();
  let ledStatus: LedStatus = 'green';
  if (rawLedStatus === 'red' || binStatus === 'full') {
    ledStatus = 'red';
  } else if (rawLedStatus === 'yellow' || binStatus === 'warning') {
    ledStatus = 'yellow';
  }

  return {
    binId: row.bin_id,
    binName: row.bin_name ?? row.bin_id, // เผื่อยังไม่ได้ใส่ข้อมูลใน bins_meta
    binSizeLiters: row.bin_size_liters ?? 0,
    fillLevel,
    lidStatus,
    binStatus,
    ledStatus,
    lidOpenCountToday: Number(row.lid_open_today ?? 0),
    fullEventCountToday: Number(row.full_events_today ?? 0),
    deviceStatus: (row.device_status as DeviceStatus) || 'online',
    lastUpdated: row.updated_at || new Date().toISOString(),
  };
}

/**
 * ดึงสถานะปัจจุบันของทุกถัง — ใช้ในหน้า Overview
 */
export async function getBins(): Promise<Bin[]> {
  const { data, error } = await supabase
    .from('bin_dashboard')
    .select('*')
    .order('bin_id', { ascending: true });

  if (error) {
    throw new Error(`getBins failed: ${error.message}`);
  }
  return (data ?? []).map(mapRowToBin);
}

/**
 * ดึงสถานะของถังใบเดียว — ใช้ตอนเปิด Insight Modal
 */
export async function getBinById(binId: string): Promise<Bin | null> {
  const { data, error } = await supabase
    .from('bin_dashboard')
    .select('*')
    .eq('bin_id', binId)
    .maybeSingle();

  if (error) {
    throw new Error(`getBinById failed: ${error.message}`);
  }
  return data ? mapRowToBin(data) : null;
}

/**
 * ดึงอนุกรมเวลา fillLevel สำหรับกราฟ Analytics
 * range: 'today' = 24 ชม.ล่าสุด, '7d' = 7 วันล่าสุด
 */
export async function getFillLevelHistory(
  range: 'today' | '7d',
  binId?: string
): Promise<FillLevelRecord[]> {
  const hoursBack = range === 'today' ? 24 : 24 * 7;
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('bin_fill_history')
    .select('bin_id, fill_percent, recorded_at')
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true });

  if (binId) {
    query = query.eq('bin_id', binId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn(`getFillLevelHistory notice: ${error.message}`);
    if (error.code === 'PGRST205' || error.message?.includes('bin_fill_history')) {
      return [];
    }
    throw new Error(`getFillLevelHistory failed: ${error.message}`);
  }

  return (data ?? []).map((row: any) => ({
    timestamp: row.recorded_at,
    binId: row.bin_id,
    fillLevel: Number(row.fill_percent),
  }));
}

/**
 * ดึง Event ล่าสุดของถังใบใดใบหนึ่ง — ใช้แสดง Recent Events ใน Insight Modal
 */
export async function getRecentEvents(
  binId: string,
  limit: number = 20
): Promise<BinEvent[]> {
  const { data, error } = await supabase
    .from('bin_events')
    .select('bin_id, event_type, created_at')
    .eq('bin_id', binId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`getRecentEvents failed: ${error.message}`);
  }

  return (data ?? []).map((row: any) => ({
    timestamp: row.created_at,
    binId: row.bin_id,
    eventType: row.event_type as EventType,
  }));
}

/**
 * (ทางเลือกเสริม) subscribe รับข้อมูลสด — ถ้าอยากเปลี่ยนจาก polling ทุก 10 วิ
 * มาเป็น realtime แทนในอนาคต ยังไม่ได้ต่อใช้งานตอนนี้ เก็บไว้เผื่อใช้ทีหลัง
 *
 * ตัวอย่างการใช้:
 * const channel = subscribeToBinChanges(() => refetch());
 * // ตอน unmount: channel.unsubscribe();
 */
export function subscribeToBinChanges(onChange: () => void) {
  const channel = supabase
    .channel('bin_snapshots_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bin_snapshots' },
      () => onChange()
    )
    .subscribe();

  return channel;
}
