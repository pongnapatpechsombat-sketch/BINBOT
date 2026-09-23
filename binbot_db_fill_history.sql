-- ============================================
-- BINBOT — เพิ่มตารางเก็บประวัติ fillLevel (สำหรับกราฟ Analytics)
-- บันทึกอัตโนมัติทุกครั้งที่ bin_snapshots ถูก insert/update
-- ไม่ต้องแก้โค้ด ESP32 เลย
-- ============================================

create table if not exists bin_fill_history (
    id bigint generated always as identity primary key,
    bin_id text not null,
    fill_percent numeric(5,2) not null,
    recorded_at timestamptz not null default now()
);

create index if not exists idx_bin_fill_history_bin_time
    on bin_fill_history (bin_id, recorded_at);

alter table bin_fill_history enable row level security;

-- Trigger function รันเป็นสิทธิ์ของผู้เรียก (anon ผ่าน ESP32)
-- จึงต้องมี insert policy ให้ anon เหมือน bin_events
drop policy if exists "ESP32 can insert fill history" on bin_fill_history;
create policy "ESP32 can insert fill history"
on bin_fill_history
for insert
to anon
with check (true);

drop policy if exists "Dashboard can read fill history" on bin_fill_history;
create policy "Dashboard can read fill history"
on bin_fill_history
for select
to anon
using (true);

create or replace function log_fill_history()
returns trigger as $$
begin
  insert into bin_fill_history (bin_id, fill_percent)
  values (new.bin_id, new.fill_percent);
  return new;
end;
$$ language plpgsql;

drop trigger if exists bin_snapshots_log_history on bin_snapshots;
create trigger bin_snapshots_log_history
after insert or update on bin_snapshots
for each row
execute function log_fill_history();
