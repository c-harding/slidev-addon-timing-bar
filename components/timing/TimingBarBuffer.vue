<script setup lang="ts">
import { useNav } from '@slidev/client';
import { secondsToString } from './timeFormat';

const { go } = useNav();

const { title, durationSeconds, targetSlide } = defineProps<{
  title?: string;
  durationSeconds: number;
  position: 'top' | 'bottom';
  targetSlide?: number;
}>();

function navigateToTarget() {
  if (targetSlide != null) go(targetSlide, Number.MAX_SAFE_INTEGER);
}
</script>

<template>
  <div
    class="overflow-x-hidden min-w-0 self-stretch flex"
    :style="{ flexBasis: 0, flexGrow: durationSeconds }"
  >
    <div
      class="flex-1 buffer-segment p-0.5 border-white border-2 text-center min-w-0"
      :class="[
        position === 'bottom' ? 'border-t-8' : 'border-b-8',
        targetSlide != null ? 'cursor-pointer' : 'cursor-default',
      ]"
      :title="
        title
          ? title + ': ' + secondsToString(durationSeconds) + ' buffer consumed'
          : 'Buffer: ' + secondsToString(durationSeconds)
      "
      @click="navigateToTarget"
    >
      <div v-if="title" class="overflow-hidden whitespace-nowrap">
        {{ title }}
      </div>
      <div class="overflow-hidden whitespace-nowrap text-[10px]">
        {{ secondsToString(durationSeconds) }}
      </div>
    </div>
  </div>
</template>

<style>
.buffer-segment {
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 3px,
    theme('colors.gray.300') 3px,
    theme('colors.gray.300') 6px
  );
  border-radius: 4px;
  color: theme('colors.gray.500');
  -webkit-text-stroke: 5px white;
  paint-order: stroke fill;

  &:hover {
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 3px,
      theme('colors.gray.400') 3px,
      theme('colors.gray.400') 6px
    );
  }
}
</style>
