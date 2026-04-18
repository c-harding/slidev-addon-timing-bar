import { configs, sharedState } from '@slidev/client';
import { useSessionStorage } from '@vueuse/core';
import { computed, ref, toRef } from 'vue';
import { parseClockTime } from './timeFormat';

type TimeDisplay = 'duration' | 'endTime';

/**
 * Composable that manages end-time configuration and the duration/endTime toggle.
 *
 * Reads `endTime` from Slidev configs, allows user overrides via
 * session storage, and computes the time span from timer start to the configured end time.
 */
export function useEndTime() {
  const timerState = toRef(sharedState, 'timer');

  const timeDisplay = useSessionStorage<TimeDisplay>(
    'slidev-timing-time-display',
    'duration',
  );

  const configEndTime = computed(
    () => (configs as { endTime?: string }).endTime,
  );

  const endTimeOverride = useSessionStorage<string | null>(
    'slidev-timing-endtime-override',
    null,
  );

  const endTime = computed(() => endTimeOverride.value ?? configEndTime.value);
  const editingEndTime = ref(false);
  const endTimeInput = ref('');

  /** End time parsed to seconds since midnight, or null */
  const endTimeSeconds = computed(() =>
    endTime.value ? parseClockTime(endTime.value) : null,
  );

  /** Timer start time as seconds since midnight, or null if stopped */
  const startClockSeconds = computed(() => {
    if (timerState.value.status === 'stopped' || !timerState.value.startedAt)
      return null;
    const d = new Date(timerState.value.startedAt);
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  });

  /** Duration in seconds from timer start to end time, or null */
  const endTimeSpan = computed(() => {
    if (startClockSeconds.value == null || endTimeSeconds.value == null)
      return null;
    let span = endTimeSeconds.value - startClockSeconds.value;
    if (span <= 0) span += 86400;
    return span;
  });

  return {
    timeDisplay,
    endTime,
    endTimeOverride,
    editingEndTime,
    endTimeInput,
    endTimeSeconds,
    endTimeSpan,
  };
}
