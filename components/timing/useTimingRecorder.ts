import { sharedState, useNav } from '@slidev/client';
import { useSessionStorage } from '@vueuse/core';
import { readonly, toRef, watch } from 'vue';

interface RecordedVisit {
  start: number;
  end: number;
}
interface RecordedSlideDuration {
  visits: RecordedVisit[];
}
export interface RecordedSlideDurations {
  slides: Record<number, RecordedSlideDuration>;
  currentSlide: number;
  currentStart: number;
}

/**
 * Composable that records per-slide visit durations during a presentation.
 *
 * Tracks timer state transitions and slide changes to build a log of time spent on each slide.
 * Automatically resets when the timer starts, pauses/resumes tracking with the timer,
 * and records a new visit each time the slide changes.
 *
 * Obtains the current page and timer state from Slidev's shared state and navigation.
 *
 * @returns An object containing:
 *   - `recordedDurations` — A deep-readonly ref of {@link RecordedSlideDurations} with all visit data,
 *     persisted to session storage under `"slidev-recorded-durations"`.
 */
export function useTimingRecorder() {
  const { currentPage } = useNav();
  const timerState = toRef(sharedState, 'timer');
  const recordedDurations = useSessionStorage<RecordedSlideDurations>(
    'slidev-recorded-durations',
    {
      slides: {},
      currentSlide: -1,
      currentStart: -1,
    },
  );

  /**
   * Compute elapsed seconds from the current timer state.
   */
  function currentElapsed(): number {
    const timer = timerState.value;
    if (!timer.startedAt) return 0;
    if (timer.status === 'paused')
      return (timer.pausedAt - timer.startedAt) / 1000;
    return (Date.now() - timer.startedAt) / 1000;
  }

  /**
   * Close the current slide visit and record its start/end timestamps.
   * No-op if no visit is in progress.
   */
  function endCurrentVisit() {
    const rec = recordedDurations.value;
    if (rec.currentSlide < 0 || rec.currentStart < 0) return;
    const end = currentElapsed();
    if (!rec.slides[rec.currentSlide]) {
      rec.slides[rec.currentSlide] = { visits: [] };
    }
    rec.slides[rec.currentSlide].visits.push({ start: rec.currentStart, end });
    rec.currentStart = -1;
  }

  /**
   * Start tracking a new visit to the current slide.
   * Records the current page and elapsed time as the visit start.
   */
  function beginVisit() {
    recordedDurations.value.currentSlide = currentPage.value;
    recordedDurations.value.currentStart = currentElapsed();
  }

  // Reset when timer transitions from stopped → running/paused
  watch(
    () => timerState.value.status,
    (newStatus, oldStatus) => {
      if (
        oldStatus === 'stopped' &&
        (newStatus === 'running' || newStatus === 'paused')
      ) {
        recordedDurations.value = {
          slides: {},
          currentSlide: -1,
          currentStart: -1,
        };
        if (newStatus === 'running') beginVisit();
      } else if (oldStatus === 'running' && newStatus === 'paused') {
        endCurrentVisit();
      } else if (oldStatus === 'paused' && newStatus === 'running') {
        beginVisit();
      } else if (newStatus === 'stopped') {
        endCurrentVisit();
      }
    },
  );

  // Track slide transitions while running
  watch(currentPage, () => {
    if (timerState.value.status !== 'running') return;
    endCurrentVisit();
    beginVisit();
  });

  /**
   * Flush the in-progress visit: end the current visit and immediately begin a new one.
   * Useful for snapshotting recorded durations while the timer is still running.
   */
  function flushCurrentVisit() {
    if (timerState.value.status !== 'running') return;
    endCurrentVisit();
    beginVisit();
  }

  return { recordedDurations: readonly(recordedDurations), flushCurrentVisit };
}
