'use client';

import { useState, useSyncExternalStore } from 'react';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** No-op subscribe: browser speech-synthesis support never changes after load, so there's nothing to re-subscribe to. */
function subscribeNever() {
  return () => {};
}

/**
 * Reads browser support for speechSynthesis without a hydration mismatch —
 * `useSyncExternalStore` renders the server snapshot (false) during SSR and
 * hydration, then swaps to the real client snapshot right after, instead of
 * synchronously setting state inside an effect.
 */
function useSpeechSupported(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    () => false
  );
}

/** Defensive only — `spokenName` should already be clean real words, but strip anything unusual just in case. */
function sanitizeForSpeech(text: string): string {
  return text
    .replace(/[([][^)\]]*[)\]]/g, '')
    .replace(/[*/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return (
    voices.find((v) => v.lang === 'en-US' && v.localService) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en') && v.localService) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  );
}

/**
 * "How to say this" widget, mirroring the phonetic-spelling + speaker-icon
 * pattern search engines show for pronunciation queries.
 *
 * The two pieces of text serve different jobs and must not be conflated:
 * `pronunciation` (shown as text) is an invented phonetic respelling for a
 * reader to sound out themselves — TTS engines have never seen spellings
 * like "DIKE-struh" and guess badly at them with generic letter-to-sound
 * rules. `spokenName` (fed to speechSynthesis) is the real word/name
 * instead, e.g. "Dijkstra's Algorithm" or "A Star Search" — real English
 * words and names are what every speech engine is actually good at.
 */
export function PronounceButton({ name, spokenName }: { name: string; spokenName: string }) {
  const supported = useSpeechSupported();
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (!supported) return;
    const text = sanitizeForSpeech(spokenName);
    if (!text) return;

    // Cancelling unconditionally right before speak() is a well-known Chrome
    // race that can silently drop the very next speak() call — only cancel
    // when something is actually mid-utterance (e.g. a previous click here).
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Explicit lang, not whatever the OS/browser default happens to be —
    // otherwise a non-English default voice mispronounces every word.
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    // Best-effort only — if getVoices() hasn't populated yet, `lang` alone
    // still steers the browser's own default voice choice correctly. A
    // previous version waited on the `voiceschanged` event to pick a voice
    // first, but that leaked a listener per click when voices never loaded;
    // if `voiceschanged` fires later, every leaked listener fires at once,
    // replaying whichever algorithm was clicked *first* — which is exactly
    // the "stuck repeating one name" bug this simpler version avoids.
    const voice = pickEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={speak}
        disabled={!supported}
        title={supported ? `Hear "${name}" pronounced` : 'Pronunciation playback not supported in this browser'}
        aria-label={`Hear how to pronounce ${name}`}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors',
          supported ? 'hover:bg-muted hover:text-foreground' : 'opacity-40',
          speaking && 'text-primary'
        )}
      >
        <Volume2 className={cn('h-3.5 w-3.5', speaking && 'animate-pulse')} />
      </button>
    </div>
  );
}
