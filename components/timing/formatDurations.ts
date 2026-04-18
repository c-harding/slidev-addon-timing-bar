import type { DeepReadonly } from 'vue';
import { secondsToString } from './timeFormat';
import type { RecordedSlideDurations } from './useTimingRecorder';

interface SectionInfo {
  no: number;
  title: string;
  durationSeconds: number;
}

export interface SlideSummary {
  no: number;
  title: string;
  /** Duration of each individual visit in seconds. */
  visitDurations: number[];
  /** Total time spent on this slide in seconds. */
  total: number;
}

export interface SectionSummary {
  title: string;
  /** Planned duration for this section in seconds. */
  plannedSeconds: number;
  /** Actual total time spent in this section in seconds. */
  actualSeconds: number;
  slides: SlideSummary[];
}

/**
 * Aggregate recorded visit data into per-section and per-slide summaries.
 *
 * @param rec - The recorded visit data.
 * @param sections - Ordered list of timed sections with their planned durations.
 * @param slideTitles - Map from slide number to its title.
 * @param totalSlides - Total number of slides, used to compute the last section's boundary.
 * @returns An array of section summaries, omitting sections with no recorded visits.
 */
export function summariseDurations(
  rec: DeepReadonly<RecordedSlideDurations>,
  sections: SectionInfo[],
  slideTitles: ReadonlyMap<number, string>,
  totalSlides: number,
): SectionSummary[] {
  const result: SectionSummary[] = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionStart = section.no;
    const sectionEnd =
      i + 1 < sections.length ? sections[i + 1].no : totalSlides + 1;

    const slideResults: SlideSummary[] = [];
    let sectionTotal = 0;
    for (let no = sectionStart; no < sectionEnd; no++) {
      const visits = rec.slides[no]?.visits ?? [];
      if (visits.length === 0) continue;
      const visitDurations = visits.map((v) => v.end - v.start);
      const total = visitDurations.reduce((s, d) => s + d, 0);
      sectionTotal += total;
      slideResults.push({
        no,
        title: slideTitles.get(no) ?? `Slide ${no}`,
        visitDurations,
        total,
      });
    }
    if (slideResults.length > 0) {
      result.push({
        title: section.title,
        plannedSeconds: section.durationSeconds,
        actualSeconds: sectionTotal,
        slides: slideResults,
      });
    }
  }
  return result;
}

/**
 * Format section summaries into a human-readable multi-line string.
 *
 * @param sections - The section summaries to format (from {@link summariseDurations}).
 * @returns A formatted string with per-section and per-slide timing breakdowns.
 */
export function formatDurations(sections: SectionSummary[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(
      `${section.title} (${secondsToString(section.actualSeconds)} / ${secondsToString(section.plannedSeconds)}):`,
    );
    for (const slide of section.slides) {
      const parts = slide.visitDurations.map((d) => secondsToString(d));
      lines.push(
        `  ${slide.no}. ${slide.title}: ${parts.join(' + ')} = ${secondsToString(slide.total)}`,
      );
    }
  }
  return 'Recorded slide durations:\n' + lines.join('\n');
}
