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
    class="slidev-recorded-timing-modal"
    @click.self="close()"
  >
    <div class="p-5">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-base font-bold">Recorded Timings</h2>
        <button
          class="text-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-2"
          @click="close()"
        >
          &times;
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th class="text-right">#</th>
            <th>Title</th>
            <th class="text-right whitespace-nowrap">Actual</th>
            <th class="text-right whitespace-nowrap">Planned</th>
            <th class="text-right whitespace-nowrap">Diff</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(section, i) in sections" :key="section.title">
            <tr
              class="font-semibold bg-gray-50 dark:bg-gray-800"
              :class="
                i > 0 && 'border-t-2 border-gray-200 dark:border-gray-700'
              "
            >
              <td />
              <td>{{ section.title }}</td>
              <td class="text-right whitespace-nowrap">
                {{ secondsToString(section.actualSeconds) }}
              </td>
              <td class="text-right whitespace-nowrap">
                {{ secondsToString(section.plannedSeconds) }}
              </td>
              <td
                class="text-right whitespace-nowrap"
                :class="
                  section.actualSeconds > section.plannedSeconds
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-700 dark:text-green-400'
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
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="text-right text-gray-400 dark:text-gray-500">
                {{ slide.no }}
              </td>
              <td>{{ slide.title }}</td>
              <td
                class="text-right whitespace-nowrap"
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
        <tfoot>
          <tr>
            <td />
            <td>Total</td>
            <td class="text-right whitespace-nowrap">
              {{ secondsToString(totalActual) }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ secondsToString(totalPlanned) }}
            </td>
            <td
              class="text-right whitespace-nowrap"
              :class="
                totalActual > totalPlanned
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-700 dark:text-green-400'
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

<style scoped>
.slidev-recorded-timing-modal {
  max-width: min(100%, 36rem);
  max-height: 80vh;
  --uno: rounded-lg shadow-xl inset-4 text-sm 'backdrop:bg-black/40' p-0 bg-main
    text-main;
}

table {
  --table-separator-color: var(--un-color-gray-300, #d1d5db);

  max-height: 60vh;
  --uno: w-full border-collapse block overflow-y-auto;

  thead {
    box-shadow: inset 0 -2px 0 var(--table-separator-color);
    --uno: sticky top-0 bg-main text-left;
  }

  tfoot {
    box-shadow: inset 0 2px 0 var(--table-separator-color);
    --uno: sticky bottom-0 bg-main font-semibold;
  }

  th,
  td {
    --uno: py-1 pr-2;
  }

  th:last-child,
  td:last-child {
    --uno: pr-4;
  }
}

.dark table {
  --table-separator-color: var(--un-color-gray-600, #4b5563);
}
</style>
