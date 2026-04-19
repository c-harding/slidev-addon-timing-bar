---
routeAlias: qr-section
title: Quick Reference - Frontmatter
---

# Quick Reference

## `section` frontmatter

| Value                                     | Effect                                           |
| ----------------------------------------- | ------------------------------------------------ |
| `section: true`                           | Untimed — shares unallocated time by slide count |
| `section: { duration: 5m }`               | Timed section with a planned duration            |
| `section: { title: Intro, duration: 1m }` | Override the timing bar label                    |
| `section: { buffer: true }`               | Pure buffer point (zero-width wedge, unlimited)  |
| `section: { buffer: 1m }`                 | Buffer point with a cap                          |
| `section: { duration: 5m, buffer: true }` | Timed + unlimited buffer                         |
| `section: { duration: 5m, buffer: 1m }`   | Timed + capped buffer                            |

---
routeAlias: qr-headmatter
title: Quick Reference - Headmatter
---

# Quick Reference

## Headmatter

| Key        | Example   | Effect                      |
| ---------- | --------- | --------------------------- |
| `duration` | `35min`   | Total presentation duration |
| `endTime`  | `'14:30'` | Target end time             |
