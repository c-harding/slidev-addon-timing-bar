# Installation

Install the package and add it to your headmatter:

```bash
npm install slidev-addon-timing-bar
```

```yaml
---
addons:
  - slidev-addon-timing-bar
---
```

The timing bar appears automatically in **presenter mode**. No additional setup needed.

<v-click>

Optionally, install the AI agent skill:

```bash
npx skills add slidev-addon-timing-bar
```

</v-click>

<!--
That's it — two steps. The addon registers a custom nav control that renders the timing bar when you're in presenter mode.
The agent skill lets AI assistants help you configure section durations.
-->

---

# Simplest Config

Set the overall presentation duration — time is distributed evenly across all slides:

```yaml
---
duration: 35min
---
```

Supported duration formats:

| Format          | Example                   |
| --------------- | ------------------------- |
| Minutes         | `5m`, `5min`, `1.5min`    |
| Hours + minutes | `1h20m`                   |
| Seconds         | `90s`                     |
| Combined        | `4m30s`                   |
| Bare number     | `35` (treated as minutes) |

<!--
This is the simplest configuration. Just set a total duration and the bar will show even segments for all your slides.
No section markers needed at all.
-->
