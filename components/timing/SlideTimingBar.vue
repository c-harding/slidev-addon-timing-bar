<script setup lang="ts">
import { configs, sharedState, useNav } from '@slidev/client';
import { useInterval, useLocalStorage, useSessionStorage } from '@vueuse/core';
import { computed, nextTick, ref, toRef, watchEffect } from 'vue';
import { formatDurations, summariseDurations } from './formatDurations';
import {
  getFrontmatter,
  getSlideTitle,
  parseSection,
  type SectionInfoItem,
} from './parseFrontmatter';
import RecordedTimingModal from './RecordedTimingModal.vue';
import { parseDuration, secondsToString } from './timeFormat';
import TimingBarSection from './TimingBarSection.vue';
import { useBufferConsumption } from './useBufferConsumption';
import { useEndTime } from './useEndTime';
import { useTimingRecorder } from './useTimingRecorder';

const { position: defaultPosition = 'bottom' } = defineProps<{
  position?: 'top' | 'bottom';
}>();

const { slides, currentPage, clicks, clicksTotal } = useNav();

type BarPosition = 'top' | 'bottom' | 'hidden';
const barPosition = useLocalStorage<BarPosition>(
  'slidev-timing-bar-height-position',
  defaultPosition,
);

const oppositePositions = { top: 'bottom', bottom: 'top' } as const;

function nextBarPosition(pos: BarPosition): BarPosition {
  switch (pos) {
    case 'hidden':
      return defaultPosition;
    case defaultPosition:
      return oppositePositions[defaultPosition];
    default:
      return 'hidden';
  }
}

function cycleBarPosition() {
  barPosition.value = nextBarPosition(barPosition.value);
}

const vFocus = { mounted: (el: HTMLElement) => el.focus() };

const timerState = toRef(sharedState, 'timer');
const interval = useInterval(100, { controls: true });
const { recordedDurations, flushCurrentVisit } = useTimingRecorder();

const elapsed = computed(() => {
  void interval.counter.value; // trigger reactivity
  if (timerState.value.status === 'stopped' || !timerState.value.startedAt)
    return 0;
  if (timerState.value.status === 'paused')
    return (timerState.value.pausedAt - timerState.value.startedAt) / 1000;
  return (Date.now() - timerState.value.startedAt) / 1000;
});

const sections = computed(() =>
  slides.value.filter((s, i) => {
    const fm = getFrontmatter(s);
    return i === 0 || (parseSection(fm) != null && !fm?.disabled);
  }),
);

const sectionInfo = computed(() => {
  const mapped = sections.value.map((s) => {
    const fm = getFrontmatter(s)!;
    const parsed = parseSection(fm);
    return { s, parsed };
  });
  // If any section has explicit `section:` frontmatter, treat implicit (no frontmatter) sections
  // as zero-duration fixed sections rather than untimed.
  const anyExplicit = mapped.some((m) => m.parsed != null);
  return mapped.map(
    ({ s, parsed }): SectionInfoItem => ({
      no: s.no,
      title: getSlideTitle(s),
      durationSeconds: parsed?.duration ?? 0,
      isBuffer: parsed?.buffer ?? false,
      isUntimed: parsed ? parsed.isUntimed : !anyExplicit,
      bufferLimit: parsed?.bufferLimit ?? null,
    }),
  );
});

const contentSum = computed(() =>
  sectionInfo.value.reduce((sum, s) => sum + s.durationSeconds, 0),
);

const prologueSection = computed(() => {
  const first = sectionInfo.value[0];
  return first &&
    first.durationSeconds === 0 &&
    !first.isBuffer &&
    !first.isUntimed
    ? first
    : null;
});

const timedSectionInfo = computed(() =>
  prologueSection.value ? sectionInfo.value.slice(1) : sectionInfo.value,
);

const hasUntimed = computed(() => sectionInfo.value.some((s) => s.isUntimed));

// Warn about mixed untimed + buffer slides
watchEffect(() => {
  if (hasUntimed.value && sectionInfo.value.some((s) => s.isBuffer)) {
    console.warn(
      '[SlideTimingBar] Mixing untimed sections (section: true) with buffer sections (section: { buffer: true }) is not fully supported. Buffer sections will be treated as untimed.',
    );
  }
});

/**
 * The duration of the entire deck, in seconds, as given in the headmatter.
 */
const deckDuration = computed(() => {
  const raw = configs.duration;
  if (!raw) return null;
  const minutes = parseDuration(String(raw));
  return minutes != null ? minutes * 60 : null;
});

const durationOverride = useSessionStorage<number | null>(
  'slidev-timing-duration-override',
  null,
);
const editingDuration = ref(false);
const durationInput = ref('');
/** The duration of the presentation, as overridden by the user, given in the headmatter, or the total of all section durations */
const configuredDuration = computed(
  () => durationOverride.value ?? deckDuration.value ?? contentSum.value,
);

/** The effective duration of the presentation, taking into account end-time mode and overrides */
const effectiveDuration = computed(() => {
  // In end-time mode, use the actual span from start to end time
  if (timeDisplay.value === 'endTime' && endTimeSpan.value != null) {
    return endTimeSpan.value;
  }
  return configuredDuration.value;
});

const unallocatedTime = computed(() =>
  Math.max(0, effectiveDuration.value - contentSum.value),
);

/** The total time left as a buffer */
const bufferPool = computed(() =>
  hasUntimed.value ? 0 : unallocatedTime.value,
);

// For untimed sections: distribute unallocated time proportional to slide count
const allSlides = computed(() => {
  const result: { no: number; title: string; sectionNo: number }[] = [];
  let currentSectionNo = slides.value.length > 0 ? slides.value[0].no : -1;
  for (const slide of slides.value) {
    const fm = getFrontmatter(slide);
    if (parseSection(fm) != null && !fm?.disabled) currentSectionNo = slide.no;
    result.push({
      no: slide.no,
      title: getSlideTitle(slide),
      sectionNo: currentSectionNo,
    });
  }
  return result;
});

/** Slides grouped by section number */
const slidesPerSection = computed(() =>
  Map.groupBy(allSlides.value, (s) => s.sectionNo),
);

/** A map from section to its share of unallocated time */
const untimedShares = computed(() => {
  const shares = new Map<number, number>();
  if (!hasUntimed.value) return shares;
  const unallocated = unallocatedTime.value;
  const untimedSections = timedSectionInfo.value.filter(
    (s) =>
      s.isUntimed ||
      // Fallback: treat zero-duration buffers as untimed if there are any untimed sections,
      // because buffers can’t be used in conjunction with untimed sections.
      (hasUntimed.value && s.isBuffer && s.durationSeconds === 0),
  );
  const totalUntimedSlides = untimedSections.reduce(
    (sum, s) => sum + (slidesPerSection.value.get(s.no)?.length ?? 0),
    0,
  );
  for (const s of untimedSections) {
    const slideCount = slidesPerSection.value.get(s.no)?.length ?? 0;
    shares.set(
      s.no,
      totalUntimedSlides > 0
        ? (unallocated * slideCount) / totalUntimedSlides
        : 0,
    );
  }
  return shares;
});

/** Scale factor for compressed mode (effectiveDuration < contentSum) */
const compressionScale = computed(() => {
  if (hasUntimed.value) return 1;
  if (contentSum.value > 0 && effectiveDuration.value < contentSum.value) {
    return effectiveDuration.value / contentSum.value;
  }
  return 1;
});

/** Effective flex size for a section in the bar, in seconds */
function sectionFlexGrow(s: SectionInfoItem): number {
  if (s.isUntimed || (hasUntimed.value && s.isBuffer)) {
    return untimedShares.value.get(s.no) ?? 0;
  }
  return s.durationSeconds * compressionScale.value;
}

const { remainingBuffer, bufferConsumedAt } = useBufferConsumption({
  bufferPool,
  sectionInfo,
  allSlides,
  elapsed,
  recordedDurations,
});

const currentSection = computed(() => {
  const page = currentPage.value;
  return (
    sections.value.findLast((s) => s.no <= page)?.no ??
    (slides.value.length > 0 ? slides.value[0].no : -1)
  );
});

const sectionSlides = computed(
  () => slidesPerSection.value.get(currentSection.value) ?? [],
);

const sectionProgress = computed(() => {
  if (sectionSlides.value.length === 0) return 0;
  const sectionStart = sectionSlides.value[0].no;
  const totalSlides = sectionSlides.value.length;
  if (totalSlides <= 0) return 0;

  const slideIdx = currentPage.value - sectionStart;
  const clickStates = clicksTotal.value + 1;
  const clickIdx = clicks.value;

  const posInSlide = (2 * clickIdx + 1) / (2 * clickStates);
  return ((slideIdx + posInSlide) / totalSlides) * 100;
});

/**
 * The expected time range (in seconds) that the progress arrow should fall
 * within for the current section. Accounts for the section's flex size plus
 * any consumed buffer blocks attached to it.
 *
 * Used by {@link arrowColor} to determine whether the presenter is ahead,
 * on track, or behind schedule.
 */
const expectedRange = computed(() => {
  let start = 0;
  for (const s of sectionInfo.value) {
    const size = sectionFlexGrow(s);
    const usedBuffer = s.isBuffer ? bufferConsumedAt(s.no) : 0;
    const end = start + size + usedBuffer;
    if (s.no === currentSection.value) return { start, end };
    start = end;
  }
  // Past all sections — in trailing buffer zone
  return { start, end: start + remainingBuffer.value };
});

const arrowColor = computed(() => {
  const e = elapsed.value;
  const { start, end } = expectedRange.value;
  if (e >= start && e <= end) return '#000'; // on track
  if (e < start) return '#22c55e'; // ahead (green-500)
  return '#ef4444'; // behind (red-500)
});

const {
  timeDisplay,
  endTime,
  endTimeOverride,
  editingEndTime,
  endTimeInput,
  endTimeSeconds,
  endTimeSpan,
} = useEndTime();

const totalDurationString = computed(() =>
  secondsToString(configuredDuration.value),
);

const progressPct = computed(() =>
  effectiveDuration.value > 0
    ? Math.min((elapsed.value / effectiveDuration.value) * 100, 100)
    : 0,
);

const timeUntilEnd = computed(() => {
  if (endTimeSeconds.value == null) return null;
  void interval.counter.value;
  const now = new Date();
  const nowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let diff = endTimeSeconds.value - nowSeconds;
  if (diff <= 0) diff += 86400;
  return diff;
});

const showPlayToEnd = computed(() => {
  if (timeUntilEnd.value == null) return false;
  if (configuredDuration.value <= 0) return false;
  return timeUntilEnd.value < configuredDuration.value;
});

function playToEnd() {
  if (endTimeSeconds.value == null) return;
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  let endTimeMs = todayMidnight + endTimeSeconds.value * 1000;
  if (endTimeMs <= now.getTime()) endTimeMs += 86400 * 1000;

  timerState.value = {
    ...timerState.value,
    status: 'paused',
    startedAt: endTimeMs - configuredDuration.value * 1000,
    pausedAt: now.getTime(),
  };
  timeDisplay.value = 'endTime';

  nextTick(() => {
    const playIcon = document.querySelector<HTMLElement>(
      '.slidev-presenter > .grid-container > .grid-section.bottom > div:nth-child(3) .i-carbon\\:play',
    );
    playIcon?.click();
  });
}

const hasRecordedDurations = computed(
  () => Object.keys(recordedDurations.value).length > 0,
);

const showTimingModal = ref<InstanceType<typeof RecordedTimingModal>>();

const timingSummary = computed(() => {
  const slideTitles = new Map(
    slides.value.map((s) => [s.no, getSlideTitle(s)]),
  );
  return summariseDurations(
    recordedDurations.value,
    sectionInfo.value,
    slideTitles,
    slides.value.length,
  );
});

function logRecordedDurations() {
  flushCurrentVisit();
  console.log(formatDurations(timingSummary.value));
  showTimingModal.value?.show();
}
</script>

<template>
  <Teleport v-if="barPosition !== 'hidden'" defer :to="'.slidev-presenter'">
    <div
      class="slide-timing-bar flex flex-row items-stretch col-span-full px-2 bg-white"
      :class="[
        `slide-timing-bar--${barPosition}`,
        barPosition === 'bottom' ? 'border-t pb-7px' : 'border-b pt-7px',
      ]"
      :style="{ order: barPosition === 'top' ? -10 : 10 }"
    >
      <TimingBarSection
        v-if="prologueSection"
        :section-no="prologueSection.no"
        :title="prologueSection.title"
        duration-string="-"
        :slides="slidesPerSection.get(prologueSection.no) ?? []"
        :active="currentSection === prologueSection.no"
        :current-page="currentPage"
        :progress="sectionProgress"
        :position="barPosition"
        class="text-xs h-12"
        :class="barPosition === 'bottom' ? 'self-end' : 'self-start'"
      />
      <div
        :class="
          barPosition === 'bottom' ? 'flex flex-col-reverse' : 'flex flex-col'
        "
        class="flex-1 min-w-0"
      >
        <div class="flex text-xs rounded z-100 w-100% relative h-12">
          <template v-for="section in timedSectionInfo" :key="section.no">
            <TimingBarSection
              :section-no="section.no"
              :title="section.title"
              :duration-string="
                section.isUntimed || (hasUntimed && section.isBuffer)
                  ? '-'
                  : secondsToString(section.durationSeconds * compressionScale)
              "
              :slides="slidesPerSection.get(section.no) ?? []"
              :active="currentSection === section.no"
              :current-page="currentPage"
              :progress="sectionProgress"
              :position="barPosition"
              :wedge="sectionFlexGrow(section) === 0"
              :style="
                sectionFlexGrow(section) > 0
                  ? { flexBasis: 0, flexGrow: sectionFlexGrow(section) }
                  : undefined
              "
            />
            <!-- Consumed buffer block at this buffer point -->
            <div
              v-if="section.isBuffer && bufferConsumedAt(section.no) > 0"
              class="overflow-x-hidden min-w-0 self-stretch flex"
              :style="{
                flexBasis: 0,
                flexGrow: bufferConsumedAt(section.no),
              }"
            >
              <div
                class="flex-1 buffer-segment p-0.5 border-white border-2 text-center min-w-0 cursor-default"
                :class="barPosition === 'bottom' ? 'border-t-8' : 'border-b-8'"
                :title="
                  section.title +
                  ': ' +
                  secondsToString(bufferConsumedAt(section.no)) +
                  ' buffer consumed'
                "
              >
                <div class="truncate text-[10px]">
                  {{ secondsToString(bufferConsumedAt(section.no)) }}
                </div>
              </div>
            </div>
          </template>
          <!-- Trailing buffer: remaining after all consumption -->
          <div
            v-if="remainingBuffer > 0"
            class="overflow-x-hidden min-w-0 self-stretch flex"
            :style="{
              flexBasis: 0,
              flexGrow: remainingBuffer,
            }"
          >
            <div
              class="flex-1 buffer-segment p-0.5 border-white border-2 text-center min-w-0 cursor-default"
              :class="barPosition === 'bottom' ? 'border-t-8' : 'border-b-8'"
              :title="'Buffer: ' + secondsToString(remainingBuffer)"
            >
              <div class="truncate text-[10px]">
                {{ secondsToString(remainingBuffer) }}
              </div>
            </div>
          </div>
        </div>
        <!-- Progress marker -->
        <div class="relative h-3 mt-1">
          <div
            v-if="timerState.status !== 'stopped' && effectiveDuration > 0"
            class="absolute w-3 h-3 -translate-x-1/2"
            :style="{
              left: progressPct + '%',
              clipPath:
                barPosition === 'bottom'
                  ? 'polygon(50% 100%, 0 0, 100% 0)'
                  : 'polygon(50% 0, 0 100%, 100% 100%)',
              backgroundColor: arrowColor,
            }"
          />
        </div>
      </div>
    </div>
  </Teleport>
  <Teleport
    defer
    to=".slidev-presenter > .grid-container > .grid-section.bottom"
  >
    <div class="flex items-center px-2">
      <fieldset
        v-if="barPosition !== 'hidden'"
        class="flex flex-col text-xs gap-1 justify-center w-24"
      >
        <label
          class="flex items-center gap-1 cursor-pointer"
          title="Presentation duration"
        >
          <input type="radio" value="duration" v-model="timeDisplay" />
          <span class="i-carbon-hourglass" />
          <span
            v-if="!editingDuration"
            @dblclick="
              editingDuration = true;
              durationInput = String(effectiveDuration / 60) + 'm';
            "
          >
            {{ totalDurationString }}
          </span>
          <input
            v-else
            v-model="durationInput"
            class="w-14 bg-transparent border-b border-current outline-none"
            @keydown.enter="
              durationOverride =
                (parseDuration(durationInput) ?? 0) * 60 || null;
              editingDuration = false;
            "
            @keydown.escape="editingDuration = false"
            @blur="
              durationOverride =
                (parseDuration(durationInput) ?? 0) * 60 || null;
              editingDuration = false;
            "
            v-focus
          />
        </label>
        <label
          class="flex items-center gap-1"
          :class="endTime ? 'cursor-pointer' : 'opacity-40'"
          title="Presentation end time"
        >
          <input
            type="radio"
            value="endTime"
            :disabled="!endTime"
            v-model="timeDisplay"
          />
          <span class="i-carbon-time" />
          <span
            v-if="!editingEndTime"
            @dblclick="
              editingEndTime = true;
              endTimeInput = endTime ?? '';
            "
          >
            {{ endTime ?? 'End time' }}
          </span>
          <input
            v-else
            v-model="endTimeInput"
            class="w-14 bg-transparent border-b border-current outline-none"
            @keydown.enter="
              endTimeOverride = endTimeInput || null;
              editingEndTime = false;
              timeDisplay = 'endTime';
            "
            @keydown.escape="editingEndTime = false"
            @blur="
              endTimeOverride = endTimeInput || null;
              editingEndTime = false;
            "
            v-focus
          />
        </label>
      </fieldset>
      <button
        v-if="barPosition !== 'hidden'"
        :disabled="!showPlayToEnd"
        class="text-xs slidev-icon-btn"
        :title="
          endTimeSeconds
            ? 'Catch up to end time'
            : 'Catch up to end time (requires duration and end time)'
        "
        @click="playToEnd"
      >
        <svg
          viewBox="0 0 16 16"
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
        >
          <polygon points="1,2 11,8 1,14" />
          <line x1="13.25" y1="2" x2="13.25" y2="14" />
        </svg>
      </button>
      <button
        :disabled="!hasRecordedDurations"
        class="text-xs slidev-icon-btn"
        :title="
          hasRecordedDurations
            ? 'Show recorded timings'
            : 'No recorded timings yet'
        "
        @click="logRecordedDurations()"
      >
        <span class="i-carbon-catalog" />
      </button>
      <button
        class="text-xs slidev-icon-btn"
        :class="{
          'arrow-up': barPosition === 'top',
          'arrow-down': barPosition === 'bottom',
        }"
        title="Toggle timing bar"
        @click="cycleBarPosition()"
      >
        <span class="i-carbon-progress-bar" />
      </button>
    </div>
  </Teleport>
  <RecordedTimingModal ref="showTimingModal" :sections="timingSummary" />
</template>

<style>
/* Hide existing progress bar when the timing bar replaces the top area */
.slidev-presenter > :first-child {
  max-height: 0;
  overflow: hidden;
}

.slidev-presenter:has(.slide-timing-bar--top) > :first-child {
  display: none;
}

/* Move the built-in timing bar to the right of the custom timing controls */
.slidev-presenter > .grid-container > .grid-section.bottom > :nth-child(3) {
  order: 10;
  padding-left: 4px !important;
}

/* Set section bar height variable on the grid container */
.slidev-present {
  --slidev-timing-bar-height: 72px;
}

/* Adjust the notes vertical resizer position */
.slidev-presenter:has(.slide-timing-bar--bottom)
  :is(.notes-vertical-resizer, .notes-vertical-resizer-left) {
  bottom: calc(
    var(--slidev-timing-bar-height, 0) +
      var(--slidev-presenter-bottom-height, 0px)
  );
}

.slidev-presenter:has(.slide-timing-bar--top)
  :is(.notes-vertical-resizer, .notes-vertical-resizer-left) {
  top: var(--slidev-timing-bar-height, 0);
}

.buffer-segment {
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 3px,
    rgba(128, 128, 128, 0.15) 3px,
    rgba(128, 128, 128, 0.15) 6px
  );
  border-radius: 4px;
  color: rgb(107, 114, 128);
}

.slidev-icon-btn:disabled {
  opacity: 40%;

  &:hover {
    background: transparent;
  }
}

button.arrow-up,
button.arrow-down {
  --uno: relative;
}

button.arrow-up::before,
button.arrow-down::before {
  content: '';
  position: absolute;
  width: 0;
  border-width: 3px;
  border-color: transparent;
  inset-inline: 0;
  margin-inline: auto;
}

button.arrow-up::before {
  top: 3px;
  border-bottom-color: currentColor;
}

button.arrow-down::before {
  bottom: 3px;
  border-top-color: currentColor;
}
</style>
