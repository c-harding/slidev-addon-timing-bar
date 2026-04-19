# Progress Arrow

The progress arrow tracks elapsed time and is **color-coded**:

<div class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 my-8 items-center">
  <img src="/black-marker.png" alt="Black arrow" class="rounded shadow h-12 justify-self-center" />
  <span><strong>Black</strong> — On track</span>
  <img src="/green-marker.png" alt="Green arrow" class="rounded shadow h-12 justify-self-center" />
  <span><strong>Green</strong> — Ahead of schedule</span>
  <img src="/red-marker.png" alt="Red arrow" class="rounded shadow h-12 justify-self-center" />
  <span><strong>Red</strong> — Behind schedule</span>
</div>

It points to the part of the presentation that you should be at, based on elapsed time.

<!--
At a glance, you know if you're on pace. Green means you have time to spare, red means you need to speed up or cut content.
-->

---

# End-Time Mode

Set an `endTime` to track when your talk should finish:

<div class="grid grid-cols-2 gap-4 items-center">

```yaml
---
duration: 10min
endTime: '14:30'
---
```

<img src="/radio-buttons.png" alt="Duration and end-time radio buttons" />

</div>

<v-clicks>

- Toggle between modes with the <carbon-hourglass /> / <carbon-time /> radio buttons next to the clock
- **Duration mode**: available time = configured duration
- **End-time mode**: available time = time until end time (recalculated on pause/resume)
- **Double-click** the label to override the value inline
- **"Catch up"** button — skip timer ahead to finish on schedule

</v-clicks>

<!--
End-time mode is great for talks with a hard stop. If your session is at 2pm–2:35pm, set endTime to '14:35' and the bar adapts in real time.
If you pause and resume, it recalculates based on the current clock.
-->

---

# Section Progress

The current section is highlighted in **blue**, with a progress bar showing how far through it you are.

<v-clicks>

- Progress is based on slides visited within the section, including click steps
- **Hover** over any section to see individual slide titles in a tooltip
- **Click** a section or slide marker to **jump directly** to that slide
- **Toggle position** — click the progress bar icon to move the bar to top, bottom, or hide it

</v-clicks>

<!--
The blue highlight and progress bar give you a sense of where you are within the current section, not just overall.
The bar is also fully interactive — you can navigate by clicking, and reposition or hide it.
-->

---
layout: image-right
image: /recorded-timings.png
backgroundSize: contain
---

# Timing Review

After your talk, review what actually happened:

<v-clicks>

- Click the **catalog button** <carbon-catalog class="inline" /> to open the review modal
- Shows **actual vs. planned** time per section and per slide
- Color-coded differences — green for under, red for over
- Also logs a detailed text summary to the **browser console**

</v-clicks>

<!--
This is invaluable for rehearsal. Run through your talk, then review exactly where you spent too much or too little time.
The console log gives you a copy-pasteable summary.
-->

---
layout: fact
---

# Q&A
