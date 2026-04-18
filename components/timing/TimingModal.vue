<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SectionSummary } from './formatDurations';
import { secondsToString } from './timeFormat';

const props = defineProps<{
  sections: SectionSummary[];
}>();

const totalActual = computed(() =>
  props.sections.reduce((sum, s) => sum + s.actualSeconds, 0),
);
const totalPlanned = computed(() =>
  props.sections.reduce((sum, s) => sum + s.plannedSeconds, 0),
);

const dialogRef = ref<HTMLDialogElement>();

function show() {
  dialogRef.value?.showModal();
}

function close() {
  dialogRef.value?.close();
}

defineExpose({ show, close });
</script>

<template>
  <dialog
    ref="dialogRef"
    class="rounded-lg shadow-xl max-w-xl w-full max-h-[80vh] text-sm backdrop:bg-black/40 p-0"
    @click.self="close()"
  >
    <div class="p-5">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-base font-bold">Recorded Timings</h2>
        <button
          class="text-lg cursor-pointer hover:bg-gray-200 rounded px-2"
          @click="close()"
        >
          &times;
        </button>
      </div>
      <table class="w-full border-collapse block max-h-[60vh] overflow-y-auto">
        <thead
          class="sticky top-0 bg-white"
          style="box-shadow: inset 0 -2px 0 var(--un-color-gray-300, #d1d5db)"
        >
          <tr class="text-left">
            <th class="py-1 pr-2 text-right">#</th>
            <th class="py-1 pr-2">Title</th>
            <th class="py-1 pr-2 text-right whitespace-nowrap">Actual</th>
            <th class="py-1 pr-2 text-right whitespace-nowrap">Planned</th>
            <th class="py-1 pr-4 text-right whitespace-nowrap">Diff</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(section, i) in sections" :key="section.title">
            <tr
              class="font-semibold bg-gray-50"
              :class="i > 0 && 'border-t-2 border-gray-200'"
            >
              <td class="py-1 pr-2" />
              <td class="py-1 pr-2">{{ section.title }}</td>
              <td class="py-1 pr-2 text-right whitespace-nowrap">
                {{ secondsToString(section.actualSeconds) }}
              </td>
              <td class="py-1 pr-2 text-right whitespace-nowrap">
                {{ secondsToString(section.plannedSeconds) }}
              </td>
              <td
                class="py-1 pr-4 text-right whitespace-nowrap"
                :class="
                  section.actualSeconds > section.plannedSeconds
                    ? 'text-red-600'
                    : 'text-green-700'
                "
              >
                {{ section.actualSeconds > section.plannedSeconds ? '+' : ''
                }}{{
                  secondsToString(
                    section.actualSeconds - section.plannedSeconds,
                  )
                }}
              </td>
            </tr>
            <tr
              v-for="slide in section.slides"
              :key="slide.no"
              class="border-t border-gray-100"
            >
              <td class="py-0.5 pr-2 text-right text-gray-400">
                {{ slide.no }}
              </td>
              <td class="py-0.5 pr-2">{{ slide.title }}</td>
              <td
                class="py-0.5 pr-2 text-right whitespace-nowrap"
                :title="
                  slide.visitDurations
                    .map((d) => secondsToString(d))
                    .join(' + ')
                "
              >
                {{ secondsToString(slide.total) }}
              </td>
              <td />
              <td />
            </tr>
          </template>
        </tbody>
        <tfoot
          class="sticky bottom-0 bg-white font-semibold"
          style="box-shadow: inset 0 2px 0 var(--un-color-gray-300, #d1d5db)"
        >
          <tr>
            <td class="py-1 pr-2" />
            <td class="py-1 pr-2">Total</td>
            <td class="py-1 pr-2 text-right whitespace-nowrap">
              {{ secondsToString(totalActual) }}
            </td>
            <td class="py-1 pr-2 text-right whitespace-nowrap">
              {{ secondsToString(totalPlanned) }}
            </td>
            <td
              class="py-1 pr-4 text-right whitespace-nowrap"
              :class="
                totalActual > totalPlanned ? 'text-red-600' : 'text-green-700'
              "
            >
              {{ totalActual > totalPlanned ? '+' : ''
              }}{{ secondsToString(totalActual - totalPlanned) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </dialog>
</template>
