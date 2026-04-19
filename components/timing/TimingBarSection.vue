<script lang="ts">
// Shared across all TimingBarSection instances for warm-up/cool-down tooltips
let warm = false;
let warmTimeout: ReturnType<typeof setTimeout> | null = null;
</script>

<script setup lang="ts">
import TitleRenderer from '#slidev/title-renderer';
import { useNav } from '@slidev/client';
import { ref } from 'vue';

const { go } = useNav();

const {
  sectionNo,
  title,
  durationString,
  slides,
  active,
  progress,
  position = 'top',
  wedge = false,
} = defineProps<{
  sectionNo: number;
  title: string;
  durationString: string;
  slides: { no: number; title: string }[];
  active: boolean;
  currentPage: number;
  progress: number;
  position?: 'top' | 'bottom';
  wedge?: boolean;
}>();

const hoveredSlide = ref<{ no: number; title: string } | null>(null);
const tooltipVisible = ref(false);
let showTimeout: ReturnType<typeof setTimeout> | null = null;

function onSlideEnter(s: { no: number; title: string }) {
  hoveredSlide.value = s;
  if (warmTimeout) {
    clearTimeout(warmTimeout);
    warmTimeout = null;
  }
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }
  if (warm) {
    tooltipVisible.value = true;
  } else {
    showTimeout = setTimeout(() => {
      tooltipVisible.value = true;
      warm = true;
    }, 400);
  }
}

function onSlideLeave() {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }
  tooltipVisible.value = false;
  hoveredSlide.value = null;
  warmTimeout = setTimeout(() => {
    warm = false;
  }, 300);
}
</script>

<template>
  <!-- Wedge mode: zero-width triangle marker -->
  <div
    v-if="wedge"
    class="section-wedge-wrapper cursor-pointer"
    :class="{ 'section-wedge-wrapper--active': active }"
    :title="title"
    @click="go(sectionNo)"
  >
    <svg
      class="section-wedge"
      :style="position === 'bottom' ? { bottom: '2px' } : { top: '2px' }"
      viewBox="0 0 12 12"
    >
      <title>{{ title }}</title>
      <polygon
        :points="position === 'bottom' ? '6,0 12,12 0,12' : '0,0 12,0 6,12'"
        :class="active ? 'fill-blue-300 dark:fill-blue-800' : 'fill-gray-300 dark:fill-gray-600'"
        paint-order="stroke"
        stroke-linejoin="miter"
        class="stroke-white dark:stroke-[#121212]"
        stroke-width="8"
      />
    </svg>
  </div>
  <!-- Normal section bar -->
  <div v-else class="overflow-x-hidden min-w-0 flex justify-center">
    <div
      class="p-0.5 border-white dark:border-[#121212] border-2 cursor-pointer text-center relative min-w-0 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 flex-1"
      :class="[
        active
          ? position === 'bottom'
            ? 'bg-blue-300! dark:bg-blue-800! pt-2'
            : 'bg-blue-300! dark:bg-blue-800! pb-2'
          : position === 'bottom'
            ? 'hover:pt-2 not-hover:border-t-8'
            : 'hover:pb-2 not-hover:border-b-8',
      ]"
      @click="go(sectionNo)"
    >
      <div class="truncate" :title="title">{{ title }}</div>
      <div class="truncate">{{ durationString }}</div>
      <div
        v-if="active"
        class="absolute left-0 h-1.5 bg-blue-600 dark:bg-blue-500"
        :class="position === 'bottom' ? 'top-0' : 'bottom-0'"
        :style="{ width: progress + '%' }"
      />
      <div
        class="absolute left-0 right-0 flex h-1.5"
        :class="position === 'bottom' ? 'top-0' : 'bottom-0'"
      >
        <div
          v-for="s in slides"
          :key="s.no"
          class="flex-1 cursor-pointer outline-solid outline-2 -outline-offset-2 outline-transparent -my-0.5 relative first:-ml-0.5 last:-mr-0.5"
          :class="active ? 'hover:outline-blue-900 dark:hover:outline-blue-400' : 'hover:outline-gray-700 dark:hover:outline-gray-400'"
          :style="{
            anchorName:
              hoveredSlide?.no === s.no ? '--hovered-slide' : undefined,
          }"
          @mouseenter="onSlideEnter(s)"
          @mouseleave="onSlideLeave()"
          @click.stop="go(s.no)"
        />
      </div>
      <div
        v-if="tooltipVisible && hoveredSlide"
        class="slide-tooltip"
        :class="
          position === 'top' ? 'slide-tooltip--below' : 'slide-tooltip--above'
        "
      >
        {{ hoveredSlide.no }}.
        <TitleRenderer class="inline-block" :no="hoveredSlide.no" />
      </div>
    </div>
  </div>
</template>

<style>
.slide-tooltip {
  position: fixed;
  position-anchor: --hovered-slide;
  justify-self: anchor-center;
  z-index: 200;
  background: rgb(0 0 0 / 0.8);
  color: white;
}
.dark .slide-tooltip {
  background: rgb(255 255 255 / 0.85);
  color: #121212;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  white-space: nowrap;
  pointer-events: none;
}

.slide-tooltip--below {
  top: anchor(bottom);
  margin-top: 20px;
  position-try-fallbacks: flip-block;
}

.slide-tooltip--above {
  bottom: anchor(top);
  margin-bottom: 2px;
  position-try-fallbacks: flip-block;
}

.section-wedge-wrapper {
  width: 0;
  position: relative;
  align-self: stretch;
  z-index: calc(10);
}
.section-wedge {
  position: absolute;
  left: -6px;
  width: 12px;
  overflow: visible;
  cursor: pointer;
}
.section-wedge polygon {
  transition: fill 0.15s;
}
.section-wedge-wrapper:hover polygon {
  --uno: fill-gray-400 dark:fill-gray-500;
}
.section-wedge-wrapper--active:hover polygon {
  --uno: fill-blue-400 dark:fill-blue-700;
}
</style>
