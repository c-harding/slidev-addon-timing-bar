import type { SlideRoute } from '@slidev/types';
import { parseDuration } from './timeFormat';

export interface ParsedSection {
  duration: number | null;
  buffer: boolean;
  bufferLimit: number | null;
  isUntimed: boolean;
}

export interface SectionInfoItem {
  no: number;
  title: string;
  durationSeconds: number;
  isBuffer: boolean;
  isUntimed: boolean;
  bufferLimit: number | null;
}

export function getFrontmatter(
  slide: SlideRoute,
): Record<string, unknown> | undefined {
  return (
    slide.meta?.slide as { frontmatter?: Record<string, unknown> } | undefined
  )?.frontmatter;
}

export function getSlideTitle(slide: SlideRoute): string {
  const fm = getFrontmatter(slide);
  const meta = slide.meta?.slide as { title?: string } | undefined;
  return String(
    fm?.shortTitle || fm?.title || meta?.title || `Slide ${slide.no}`,
  );
}

/**
 * Parse the `section` frontmatter field into a normalized object.
 *
 * Supported values:
 * - `section: true` — untimed section (no planned duration, shares unallocated time)
 * - `section: { duration: '5m' }` — timed section with a planned duration
 * - `section: { buffer: true }` — pure buffer point (zero-width wedge, absorbs unlimited excess)
 * - `section: { buffer: '1m' }` — buffer point with a cap on how much excess it can absorb
 * - `section: { duration: '5m', buffer: true }` — timed section that also acts as an unlimited buffer point
 * - `section: { duration: '5m', buffer: '1m' }` — timed section that also acts as a capped buffer point
 */
export function parseSection(
  fm: Record<string, unknown> | undefined,
): ParsedSection | null {
  const raw = fm?.section;
  if (!raw) return null;
  if (raw === true)
    return {
      duration: null,
      buffer: false,
      bufferLimit: null,
      isUntimed: true,
    };
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const duration = obj.duration
      ? (parseDuration(String(obj.duration)) ?? 0) * 60
      : null;
    const buffer = !!obj.buffer;
    const bufferLimit =
      typeof obj.buffer === 'string'
        ? (parseDuration(obj.buffer) ?? 0) * 60 || null
        : null;
    return {
      duration,
      buffer,
      bufferLimit,
      isUntimed: duration == null && !buffer,
    };
  }
  return null;
}
