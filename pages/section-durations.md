# Defining Sections

Add `section` frontmatter to chapter title slides to define timed sections:

```md
---
section:
  duration: 10m
---

# My Section Title
```

<v-clicks>

- The timing bar sizes each section **proportionally** to its planned duration
- Sections can start on any slide — they don't need to be evenly spaced
- Even the first slide can be a section title

</v-clicks>

<!--
Sections give you fine-grained control. The bar will show each section as a segment whose width reflects its planned duration.
-->

---

# Untimed Sections

Use `section: true` to mark a section **without** a planned duration:

```yaml
---
section: true
---
```

Untimed sections share any **unallocated time** proportionally by slide count.

<v-click>

> **Note:** Mixing untimed sections with buffer sections is not supported.
> Buffer sections will be treated as untimed when both are present.

</v-click>

<!--
This is useful for optional or flexible content. The time they get depends on how much is left after timed sections are accounted for.
-->

---

# Prologue Behavior

The first slide without a `section` marker is treated as a **prologue** — it gets **zero allocated time**.

```md {all}{at:0}
---
duration: 10min
---

# My Title Slide ← prologue, 0 time

---

section:
duration: 5m

---

# First Section ← starts the timed content
```

<v-click>

This slide deck's title slide is a prologue — look at the timing bar and notice it starts _after_ the first slide.

</v-click>

<!--
[click] This is a deliberate design choice — title slides typically don't need timed allocation.
You're seeing it in action right now: the first segment in the bar corresponds to "The Solution", not the title slide.
-->
