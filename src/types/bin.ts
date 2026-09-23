export type BinStatus = 'normal' | 'warning' | 'full';
export type LedStatus = 'green' | 'yellow' | 'red';
export type LidStatus = 'open' | 'closed';
export type DeviceStatus = 'online' | 'offline';

export type EventType =
  | 'lid_open'
  | 'lid_close'
  | 'full_event_start'
  | 'full_event_end'
  | 'device_online'
  | 'device_offline';

export interface Bin {
  binId: string;
  binName: string;
  binSizeLiters: number;
  fillLevel: number; // 0 - 100
  lidStatus: LidStatus;
  binStatus: BinStatus;
  ledStatus: LedStatus;
  lidOpenCountToday: number;
  fullEventCountToday: number; // Edge-triggered count
  deviceStatus: DeviceStatus;
  lastUpdated: string; // ISO 8601 string
}

export interface FillLevelRecord {
  timestamp: string;
  binId: string;
  fillLevel: number;
}

export interface BinEvent {
  timestamp: string;
  binId: string;
  eventType: EventType;
  value?: number | string | null;
}

export type TimeRange = 'today' | '7d';

export interface AggregatedFillPoint {
  timestamp: string;
  displayTime: string;
  averageFill: number;
  [binId: string]: string | number;
}
