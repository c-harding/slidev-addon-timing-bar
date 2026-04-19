# Entry Point

The addon registers via `custom-nav-controls.vue` — a Slidev convention for injecting UI into the presenter view:

```vue
<script setup lang="ts">
import { useNav } from '@slidev/client';
import SlideTimingBar from './components/timing/SlideTimingBar.vue';

const { isPresenter } = useNav();
</script>

<template>
  <SlideTimingBar v-if="isPresenter" />
</template>
```

No manual setup needed — Slidev auto-discovers this file from the addon.

<!--
This is the entire glue layer. Slidev looks for custom-nav-controls.vue in addons and renders it.
We guard with isPresenter so the bar only appears in presenter mode.
-->

---

# Architecture

<div class="grid grid-cols-2 gap-8">
<div>

## Components

- **SlideTimingBar** — main orchestrator
- **TimingBarSection** — individual segment with tooltips
- **TimingBarBuffer** — hatched buffer visualization
- **RecordedTimingModal** — review dialog

</div>
<div>

## Composables

- **useTimingRecorder** — tracks per-slide visit durations
- **useBufferConsumption** — computes buffer at each point
- **useEndTime** — manages end-time config & overrides

## Utilities

- **parseFrontmatter** — normalizes section metadata
- **timeFormat** — duration parsing & formatting
- **formatDurations** — aggregates timing summaries

</div>
</div>

<!--
The addon is built from 4 Vue components, 3 composables, and 3 utility modules.
Everything is reactive — the bar updates as you navigate and as time passes.
-->

---

# Buffer Consumption Model

Buffers use a **cumulative excess** model:

```
excess = recorded_time − planned_time (up to this buffer point)
```

<v-clicks>

- Each buffer point absorbs excess from all preceding sections
- Capped buffers limit how much a single point can absorb
- Remaining buffer is always shown as hatched area at the _end_ of the bar
- When consumed, the hatched area shifts to the consuming section

</v-clicks>

<!--
This is the key algorithm. It's a simple running sum: at each buffer point, compute how much total time you've gone over, and absorb that much.
-->

---

# Recording & Persistence

<v-clicks>

- The **useTimingRecorder** composable watches timer state and slide transitions
- Records visit start/end per slide — including revisits
- All timing data is stored in **session storage** (just like Slidev's own timer state)
- Survives page refreshes during a presentation
- Clears automatically on new sessions
- Duration and end-time overrides also persist in session storage

</v-clicks>

<!--
Session storage was chosen over localStorage so that timing data doesn't leak between separate presentation sessions.
It survives accidental refreshes but starts clean each time you open the browser.
-->
