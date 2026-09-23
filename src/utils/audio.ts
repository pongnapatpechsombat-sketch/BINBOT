/**
 * Audio utility for BinBot Dashboard using Web Audio API.
 * Synthesizes an audible alarm beep without external audio files.
 * Handles modern browser Autoplay Policies via user gesture unlocking and pending alarm queue.
 */

let sharedAudioCtx: AudioContext | null = null;
let hasPendingAlarm = false;

/**
 * Returns the singleton AudioContext, creating it if necessary.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContextClass();
  }
  return sharedAudioCtx;
}

/**
 * Unlocks the AudioContext upon user gesture (click, tap, keypress).
 * Automatically executes any pending alarm if one was waiting for user interaction.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx
      .resume()
      .then(() => {
        if (hasPendingAlarm) {
          hasPendingAlarm = false;
          executeBeep(ctx);
        }
      })
      .catch((err) => {
        console.warn('[Audio] unlockAudio failed to resume:', err);
      });
  } else if (ctx.state === 'running' && hasPendingAlarm) {
    hasPendingAlarm = false;
    executeBeep(ctx);
  }
}

// Automatically listen for first user interaction to unlock audio
if (typeof window !== 'undefined') {
  const events = ['click', 'pointerdown', 'keydown', 'touchstart'];
  const handleInteraction = () => {
    unlockAudio();
  };
  events.forEach((evt) => {
    window.addEventListener(evt, handleInteraction, { passive: true });
  });
}

/**
 * Plays a distinct two-tone alarm sound (~0.28s).
 * Frequency: 880Hz (A5) -> 1046.5Hz (C6), volume envelope 0.45.
 */
function executeBeep(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Clear two-tone alarm beep
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1046.5, now + 0.1);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.02);
    gain.gain.setValueAtTime(0.45, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  } catch (err) {
    console.warn('[Audio] Error executing beep:', err);
  }
}

/**
 * Triggers the alarm beep. If the browser blocks audio due to autoplay restrictions,
 * the beep is queued as pending and will play automatically upon the user's first click.
 */
export function playAlarmBeep(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      hasPendingAlarm = true;
      ctx
        .resume()
        .then(() => {
          if (ctx.state === 'running') {
            hasPendingAlarm = false;
            executeBeep(ctx);
          }
        })
        .catch(() => {
          // Will be played when user interacts with the page via unlockAudio()
        });
      return;
    }

    executeBeep(ctx);
  } catch (err) {
    console.warn('[Audio] Failed to play alarm beep:', err);
  }
}

/**
 * Explicit test beep for user testing (e.g. clicking the Sound button).
 */
export function testAlarmSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => executeBeep(ctx)).catch(() => {});
  } else {
    executeBeep(ctx);
  }
}
