# AI Coding-Agent Workflow

> Fill this in with your own real session log as you work. Keep 5-8 examples covering:
> requirement analysis & planning, architecture/data-model decisions, implementation,
> testing/debugging, and at least one case where you corrected or rejected AI output.
> One worked example is filled in below to show the expected level of detail — replace it
> with your actual first session, then add the rest as you go.

**Tools used:** Claude Code (Sonnet) [replace with whatever you actually used]

---

## Example 1 — Architecture: separating calculation logic from the HTTP layer

**Goal and context:** Needed to decide how to structure the NestJS backend so the portfolio
calculation logic could be unit-tested in isolation and wouldn't get tangled with
controllers/DB access.

**Prompt:**
> "Design a NestJS module structure for a portfolio calculator that processes BUY/SELL trades
> with weighted-average cost basis. The calculation logic must be testable without spinning up
> Nest's DI container or a database — pure functions only. Show me the file layout and the
> function signatures."

**Agent response:** Proposed splitting `calculation/` (pure functions/types, no Nest decorators)
from `portfolio/` (Nest service wrapping the pure engine + an injectable in-memory store) and
`import/` (CSV validation, reusing the calculation engine for the cross-row short-position
check instead of duplicating that logic).

**My review:** Checked that `portfolio-calculator.ts` has zero imports from `@nestjs/*` — confirmed
by running `grep nestjs` on the file, empty result. Ran the resulting unit tests without any Nest
test module bootstrapping to confirm they're fast/isolated.

**Outcome:** Accepted the structure as proposed. This is the layout used in `backend/src/`.

---

## Example 2 — [Requirement analysis / planning]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:**

**Outcome:**

---

## Example 3 — [Data-model decision]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:**

**Outcome:**

---

## Example 4 — [Implementation]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:**

**Outcome:**

---

## Example 5 — [Testing / debugging]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:**

**Outcome:**

---

## Example 6 — [Corrected or rejected AI output — required]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:** *(What specifically did you check that revealed the problem?)*

**Outcome:** *(What did you change, and why was the AI's version wrong or unsuitable?)*
