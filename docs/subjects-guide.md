# Working with Subjects

Periods can carry **subjects** — metadata (like employee names) that propagate through operations. This guide helps you choose between relying on built-in subject propagation vs. recovering subjects after the fact.

## How Subjects Propagate

| Operation          | Subject behavior                                       |
|--------------------|--------------------------------------------------------|
| `intersection()`   | Concatenates: `[...subjectsA, ...subjectsB]`           |
| `union()` (merge)  | Concatenates: `[...subjectsA, ...subjectsB]`           |
| `union()` (no merge) | Each period keeps its original subjects              |
| `subtract()`       | Result keeps the original period's subjects            |
| `mix()`            | Each segment gets the correct subjects per the rules above |

## When Built-in Subjects Work Well

**`mix()` is the standout.** It decomposes overlapping periods into non-overlapping segments, each with precisely the right subjects:

```typescript
const alice = Period(100, 200, "Alice");
const bob   = Period(50, 150, "Bob");

alice.mix(bob).periods();
// → Period(50, 100,  ["Bob"])            — only Bob
// → Period(100, 150, ["Alice", "Bob"])   — both
// → Period(150, 200, ["Alice"])          — only Alice
```

Each segment tells you exactly who is present. This is hard to replicate manually.

**Simple, single-step operations** also work well — one `intersection()` or `subtract()` gives you the right subjects with no extra effort.

## When to Use Post-hoc Intersection Instead

For **multi-step operation chains**, built-in subjects can lose precision:

- **Union merging** spreads subjects across the entire merged range, even though each subject may only cover part of it.
- **Chained operations** can accumulate duplicate subjects.

If you need to know precisely *which originals* map to *which output segments*, intersect the result with the originals yourself:

```typescript
const alice = Period(10, 30, "Alice");
const bob   = Period(20, 50, "Bob");
const carol = Period(40, 60, "Carol");

// Complex chain — subjects may accumulate imprecisely
const result = alice.union(bob).subtract(carol);

// Post-hoc: recover subjects with spatial precision
const originals = [alice, bob, carol];
for (const p of result.periods()) {
  const contributors = originals
    .filter(orig => orig.overlaps(p))
    .flatMap(orig => orig.subjects);
  // contributors is accurate for this specific segment
}
```

## Quick Recommendation

- **Use built-in subjects** for `mix()` and simple one-step operations.
- **Use post-hoc intersection** when chaining multiple operations and you need precise per-segment subject attribution.




Where Built-in Subjects Are Genuinely Useful

  1. The mix() operation — this is the strongest argument for subjects. Mix decomposes overlapping periods into non-overlapping segments with the correct subjects on each:

  Period(100, 200, "Alice").mix(Period(50, 150, "Bob"))
  // → [Period(50,100,["Bob"]), Period(100,150,["Alice","Bob"]), Period(150,200,["Alice"])]

  Each sub-period has the right subjects for that specific segment. This is where subjects truly shine — you get a complete, spatially-precise decomposition in one call. Post-hoc could replicate this, but it would require intersecting each result segment
  with each original — essentially re-doing what mix already does internally.

  2. Convenience for simple workflows — for the common pattern of "intersect a few periods and see who's involved," built-in subjects save the user from managing original period references and doing an extra pass.

  3. The organization holidays use case — the webapp example uses mix() to show which employees are working in each time segment. Subjects carry the employee names through, which is exactly right for visualization.

  Where Post-hoc Is Strictly Better

  1. Precision — post-hoc always gives you the exact spatial mapping between result periods and originals. Built-in subjects only tell you "who contributed" without saying where within the result.

  2. No duplicates — post-hoc can't produce duplicate subjects.

  3. Complex chains — for multi-step operation pipelines, post-hoc gives accurate results where accumulated subjects may be misleading.

  4. Simpler library internals — removing subject propagation would simplify every operation's implementation.

  My Assessment

  The subject mechanism's real value is concentrated in one operation: mix(). For mix, subject propagation produces a genuinely useful, spatially-precise result that would be tedious to replicate post-hoc.

  For all other operations (intersection, union, subtract), the built-in subjects are a convenience that trades precision for ergonomics. They give you a quick "who's involved" answer but lose the "where exactly" information. Post-hoc intersection with
  originals would be more accurate.

  The honest answer: If mix() didn't exist, I'd say subjects add marginal value and could be replaced by post-hoc intersection. But mix() is the killer feature that makes subjects worthwhile — it's the one operation where subjects are both correct
  per-segment and save significant work compared to the alternative.

  The question becomes: is mix() + simple-case convenience worth the complexity of propagating subjects through every operation? Given that the propagation logic is just [...subjects, ...other.subjects] for merge operations and subjects (unchanged) for
  subtract — it's actually quite low complexity. The cost-benefit seems favorable.

