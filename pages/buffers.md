# What Are Buffers?

Buffer sections absorb **excess time** when you run over in earlier sections.

<div class="my-4">
  <img src="/middle-buffer.png" alt="Buffer consumption" class="rounded shadow max-h-40" />
</div>

<v-clicks>

- The buffer comes from the difference between total duration and sum of section durations
- Before starting, unallocated buffer is shown as a **hatched area** at the end of the bar
- When you run over, the hatched area **moves** to the overrun section
- This gives you a visual "safety margin" for sections that might take longer

</v-clicks>

<!--
Buffers are the most powerful feature. They let you build slack into your presentation plan.
The hatched area is your visual indicator of how much buffer remains.
-->

---

# Buffer Variants

<table>
<thead><tr><th>Frontmatter</th><th>Effect</th></tr></thead>
<tbody>
<tr><td>

```yaml
section:
  buffer: true
```

</td><td>Pure buffer point — zero-width wedge, absorbs unlimited excess</td></tr>
<tr><td>

```yaml
section:
  buffer: 1m
```

</td><td>Buffer point with a cap on absorption</td></tr>
<tr><td>

```yaml
section:
  duration: 5m
  buffer: true
```

</td><td>Timed section + unlimited buffer</td></tr>
<tr><td>

```yaml
section:
  duration: 5m
  buffer: 1m
```

</td><td>Timed section + capped buffer</td></tr>
</tbody>
</table>

<!--
You can combine buffers with timed sections, or use standalone buffer points.
Capped buffers are useful when you want to limit how much slack any one section can absorb.
-->
