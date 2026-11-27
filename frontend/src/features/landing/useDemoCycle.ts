import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Scenario } from './scenarios';

export type Phase = 'idle' | 'suggesting' | 'ready' | 'accepted';

const CHARS_PER_TICK = 3;
const TICK_MS = 14;
const IDLE_MS = 900;
const READY_MS = 3600;
const ACCEPTED_MS = 2600;

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    callback => {
      const media = window.matchMedia(QUERY);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/**
 * Drives the editor demo: idle -> suggesting (ghost text types in) -> ready (waits
 * for Accept) -> accepted -> next scenario. With reduced motion it shows the
 * finished state and only changes when a file tab is clicked.
 */
export function useDemoCycle(scenarios: Scenario[], reducedMotion: boolean, paused: boolean) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(reducedMotion ? 'accepted' : 'idle');
  const [typed, setTyped] = useState(reducedMotion ? scenarios[0].suggestion.length : 0);

  const scenario = scenarios[index];
  const total = scenario.suggestion.length;

  // Reduced motion: always show the finished suggestion, no timers.
  useEffect(() => {
    if (reducedMotion) {
      setPhase('accepted');
      setTyped(total);
    }
  }, [reducedMotion, total]);

  // Reveal the suggestion a few characters at a time.
  useEffect(() => {
    if (reducedMotion || phase !== 'suggesting') return;
    const id = window.setInterval(() => setTyped(t => Math.min(t + CHARS_PER_TICK, total)), TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, reducedMotion, total]);

  useEffect(() => {
    if (phase === 'suggesting' && typed >= total) setPhase('ready');
  }, [phase, typed, total]);

  // Timed transitions. Hovering or focusing the demo pauses the slow ones so it can be read.
  useEffect(() => {
    if (reducedMotion) return;

    if (phase === 'idle') {
      const id = window.setTimeout(() => setPhase('suggesting'), IDLE_MS);
      return () => window.clearTimeout(id);
    }
    if (paused) return;

    if (phase === 'ready') {
      const id = window.setTimeout(() => setPhase('accepted'), READY_MS);
      return () => window.clearTimeout(id);
    }
    if (phase === 'accepted') {
      const id = window.setTimeout(() => {
        setIndex(i => (i + 1) % scenarios.length);
        setTyped(0);
        setPhase('idle');
      }, ACCEPTED_MS);
      return () => window.clearTimeout(id);
    }
  }, [phase, paused, reducedMotion, scenarios.length]);

  const select = useCallback(
    (next: number) => {
      setIndex(next);
      if (!reducedMotion) {
        setTyped(0);
        setPhase('idle');
      }
    },
    [reducedMotion],
  );

  const accept = useCallback(() => setPhase(current => (current === 'ready' ? 'accepted' : current)), []);

  return {
    scenario,
    index,
    phase,
    visibleSuggestion: scenario.suggestion.slice(0, typed),
    select,
    accept,
  };
}
