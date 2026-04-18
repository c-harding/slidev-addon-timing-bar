import type { DeepReadonly, Ref } from 'vue';
import { computed } from 'vue';
import type { SectionInfoItem } from './parseFrontmatter';
import type { RecordedSlideDurations } from './useTimingRecorder';

export interface BufferConsumption {
  sectionNo: number;
  /** seconds of buffer consumed at this buffer point */
  consumed: number;
}

/**
 * Composable that computes buffer consumption for each buffer point in the presentation.
 *
 * Uses a cumulative excess model: for each buffer point, the consumed buffer is
 * the excess of recorded time over planned time for all sections up to that point,
 * minus any buffer already absorbed by prior buffer points.
 */
export function useBufferConsumption(options: {
  bufferPool: Ref<number>;
  sectionInfo: Ref<SectionInfoItem[]>;
  allSlides: Ref<{ no: number; title: string; sectionNo: number }[]>;
  elapsed: Ref<number>;
  recordedDurations: Ref<DeepReadonly<RecordedSlideDurations>>;
}) {
  const { bufferPool, sectionInfo, allSlides, elapsed, recordedDurations } =
    options;

  const hasUntimed = computed(() => sectionInfo.value.some((s) => s.isUntimed));

  /**
   * Compute the total recorded time for a set of slide numbers,
   * using completed visits from recordedDurations plus the in-progress visit.
   */
  function recordedTimeForSlides(slideNos: Set<number>): number {
    const rec = recordedDurations.value;
    let total = 0;
    for (const no of slideNos) {
      const visits = rec.slides[no]?.visits;
      if (visits) {
        for (const v of visits) total += v.end - v.start;
      }
      // Add in-progress visit for the current slide
      if (no === rec.currentSlide && rec.currentStart >= 0) {
        total += elapsed.value - rec.currentStart;
      }
    }
    return total;
  }

  /**
   * For each buffer point, compute how much buffer it has consumed.
   * Uses recorded per-slide durations (not raw elapsed) so that buffer
   * consumption at a point stays stable after moving past it.
   *
   * Formula: consumed = max(0, min(
   *   recordedTime(slides up to here) - plannedTime(sections up to here) - priorBufferAbsorbed,
   *   remainingPool
   * ))
   */
  const bufferConsumptions = computed((): BufferConsumption[] => {
    if (hasUntimed.value || bufferPool.value <= 0) return [];

    const info = sectionInfo.value;
    const all = allSlides.value;
    const result: BufferConsumption[] = [];
    let cumulativePlanned = 0;
    let bufferAbsorbed = 0;
    const pool = bufferPool.value;
    const slidesUpToHere = new Set<number>();

    for (const s of info) {
      // Collect slide numbers belonging to this section
      for (const sl of all) {
        if (sl.sectionNo === s.no) slidesUpToHere.add(sl.no);
      }

      // Accumulate planned content duration
      cumulativePlanned += s.durationSeconds;

      if (!s.isBuffer) continue;

      // This is a buffer point. Compute recorded time for all slides up to here.
      const recordedTime = recordedTimeForSlides(slidesUpToHere);
      const cumulativeExcess = recordedTime - cumulativePlanned;
      const netExcess = cumulativeExcess - bufferAbsorbed;
      const remaining = pool - bufferAbsorbed;
      const limit = s.bufferLimit != null ? s.bufferLimit : remaining;
      const consumed = Math.max(0, Math.min(netExcess, remaining, limit));

      bufferAbsorbed += consumed;
      result.push({ sectionNo: s.no, consumed });
    }

    return result;
  });

  /** Total buffer consumed across all buffer points, in seconds */
  const totalBufferConsumed = computed(() =>
    bufferConsumptions.value.reduce((sum, bc) => sum + bc.consumed, 0),
  );

  /** Remaining buffer after all consumption, in seconds */
  const remainingBuffer = computed(() =>
    Math.max(0, bufferPool.value - totalBufferConsumed.value),
  );

  /** Get buffer consumed at a specific buffer point, in seconds */
  function bufferConsumedAt(sectionNo: number): number {
    return (
      bufferConsumptions.value.find((bc) => bc.sectionNo === sectionNo)
        ?.consumed ?? 0
    );
  }

  return {
    bufferConsumptions,
    totalBufferConsumed,
    remainingBuffer,
    bufferConsumedAt,
  };
}
