import fs from 'fs';
import path from 'path';

// Seeded pseudorandom function (LCG)
let seed = 42;
function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

const csvHeader = 'timestamp,binId,fillLevel\n';
const rows = [];

// Base time: 2026-09-15T17:00:00+07:00
const baseTime = new Date('2026-09-15T17:00:00+07:00');
const hoursTotal = 7 * 24; // 168 hours (7 days)

// Bins state tracking
let bin1Level = 10;
let bin2Level = 15;
let bin3Level = 20;
let bin4Level = 10;

for (let i = hoursTotal; i >= 0; i--) {
  const t = new Date(baseTime.getTime() - i * 60 * 60 * 1000);
  const hour = t.getHours();
  // format ISO with timezone +07:00
  // t is local or UTC; let's format nicely
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  const h = String(t.getHours()).padStart(2, '0');
  const isoStr = `${y}-${m}-${d}T${h}:00:00+07:00`;

  // BIN01: Emptied daily around 20:00
  if (hour === 20) {
    bin1Level = 5 + Math.floor(seededRandom() * 5);
  } else if (hour >= 8 && hour <= 18) {
    bin1Level = Math.min(90, bin1Level + 2 + Math.floor(seededRandom() * 5));
  } else {
    bin1Level = Math.min(90, bin1Level + (seededRandom() > 0.7 ? 1 : 0));
  }

  // BIN02: Cafeteria - emptied at 15:00 and 21:00
  if (hour === 15 || hour === 21) {
    bin2Level = 8 + Math.floor(seededRandom() * 6);
  } else if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 19)) {
    bin2Level = Math.min(94, bin2Level + 8 + Math.floor(seededRandom() * 8));
  } else if (hour >= 7 && hour <= 20) {
    bin2Level = Math.min(94, bin2Level + 2 + Math.floor(seededRandom() * 4));
  } else {
    bin2Level = Math.min(94, bin2Level + (seededRandom() > 0.8 ? 1 : 0));
  }

  // BIN03: Park - emptied every 48 hours, goes offline at 13:00 on Sep 15
  if (i <= 4) {
    // offline since 13:00 (i=4 is 13:00)
    // freezes at 62%
    bin3Level = 62;
  } else {
    if (i % 48 === 0) {
      bin3Level = 10 + Math.floor(seededRandom() * 5);
    } else if (hour >= 6 && hour <= 21) {
      bin3Level = Math.min(85, bin3Level + 1 + Math.floor(seededRandom() * 3));
    }
  }

  // BIN04: Admin - emptied on full
  if (i === 6) { // Sep 15 11:00
    bin4Level = 12; // emptied!
  } else if (hour === 19) {
    bin4Level = 10 + Math.floor(seededRandom() * 5);
  } else if (hour >= 8 && hour <= 17) {
    bin4Level = Math.min(98, bin4Level + 6 + Math.floor(seededRandom() * 7));
  } else {
    bin4Level = Math.min(98, bin4Level + (seededRandom() > 0.7 ? 1 : 0));
  }

  // Ensure current levels align with snapshot at i === 0 (Sep 15 17:00)
  let b1 = bin1Level;
  let b2 = bin2Level;
  let b3 = bin3Level;
  let b4 = bin4Level;

  if (i === 0) {
    b1 = 45;
    b2 = 84;
    b3 = 62;
    b4 = 97;
  }

  rows.push(`${isoStr},BIN01,${b1}`);
  rows.push(`${isoStr},BIN02,${b2}`);
  rows.push(`${isoStr},BIN03,${b3}`);
  rows.push(`${isoStr},BIN04,${b4}`);
}

const finalCsv = csvHeader + rows.join('\n');
const outDir = path.resolve('public/mock');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(path.join(outDir, 'fill_level_history.csv'), finalCsv, 'utf8');
console.log('Successfully generated public/mock/fill_level_history.csv with ' + rows.length + ' records.');
