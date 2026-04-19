---
name: slidev-addon-timing-bar
description: Add a section-based timing bar to Slidev presenter view. Use when adding presentation timing, per-section durations, buffer points, end-time tracking, or recorded timing review to a Slidev slideshow.
---

# slidev-addon-timing-bar

A Slidev addon that adds a section-based timing bar to the presenter view. Plan your talk with per-section durations, track progress in real time, and review recorded timings.

## When to Use

- Adding a timing/progress bar to a Slidev presentation
- Setting per-section durations for a talk
- Adding buffer points between sections
- Tracking presentation end time
- Reviewing actual vs. planned timing after a talk

## Installation

```bash
npm install slidev-addon-timing-bar
```

Then add it to the slide deck's headmatter:

```yaml
---
addons:
  - slidev-addon-timing-bar
---
```

No additional setup is needed — the bar appears automatically in presenter mode.

## Headmatter Configuration

Set these in the first slide's frontmatter block (headmatter):

| Key        | Example   | Effect                                  |
| ---------- | --------- | --------------------------------------- |
| `duration` | `35min`   | Total presentation duration             |
| `endTime`  | `'14:30'` | Target end time (enables end-time mode) |

```yaml
---
duration: 35min
endTime: '14:30'
addons:
  - slidev-addon-timing-bar
---
```

## Section Frontmatter

Add `section` to a slide's frontmatter to start a new timed section. The slide becomes the section's title slide.

### Timed section

```yaml
---
section:
  duration: 10m
---
# My Section Title
```

### Untimed section

Shares unallocated time proportionally by slide count:

```yaml
---
section: true
---
```

### Buffer point

Absorbs excess time when earlier sections run over:

```yaml
---
section:
  buffer: true
---
```

### Buffer with cap

```yaml
---
section:
  buffer: 2m
---
```

### Timed section with buffer

```yaml
---
section:
  duration: 10m
  buffer: true
---
```

### Timed section with capped buffer

```yaml
---
section:
  duration: 10m
  buffer: 2m
---
```

## Section Frontmatter Reference

| Value                                     | Effect                                                         |
| ----------------------------------------- | -------------------------------------------------------------- |
| `section: true`                           | Untimed section — shares unallocated time by slide count       |
| `section: { duration: 5m }`               | Timed section with a planned duration                          |
| `section: { buffer: true }`               | Pure buffer point (zero-width wedge, absorbs unlimited excess) |
| `section: { buffer: 1m }`                 | Buffer point with a cap on absorption                          |
| `section: { duration: 5m, buffer: true }` | Timed section that also acts as an unlimited buffer point      |
| `section: { duration: 5m, buffer: 1m }`   | Timed section that also acts as a capped buffer point          |

## Duration Formats

Durations accept flexible formats: `5m`, `1h20m`, `90s`, `4m30s`, `1.5min`.

## Key Behaviours

- Slides before the first `section:` slide form a **prologue** — displayed as a fixed-width block outside the timed bar.
- The progress arrow is **black** (on track), **green** (ahead), or **red** (behind schedule).
- The active section is highlighted in blue with an internal progress bar.
- Hover over the bar to see individual slide titles; click to navigate.
- Duration and end-time radio buttons appear next to the Slidev clock (⏳ / 🕒).
- Double-click the duration or end time label to override the value.
- The timing bar supports dark mode automatically.

## Constraints

- Do NOT mix `section: true` (untimed) with `section: { buffer: true }` in the same deck. Buffer sections will be treated as untimed when both are present.
- `endTime` must be quoted in YAML (e.g., `'14:30'`) to avoid being parsed as an object.
