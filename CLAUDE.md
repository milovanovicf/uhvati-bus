# UhvatiBus — repo guide

Bus reservation platform for the Serbian market. Next.js 15 App Router (React 19),
Prisma 7 + Neon PostgreSQL, custom JWT auth, Resend for email, sr-Latn + English UI.

## Where things live

| Area | Path |
|---|---|
| Server Actions (most mutations) | `src/app/actions.ts` |
| REST endpoints | `src/app/api/*/route.ts` (admin, auth, trips, cities, routes, verify-email) |
| Prisma client (app) | `src/app/utils/db.ts` — import `prisma` from here, never construct a new client in app code |
| Validation schemas (Zod) | `src/lib/validation.ts` |
| Email templates/sending | `src/lib/email.ts` |
| Signed reservation links | `src/lib/reservationToken.ts` |
| Translations | `src/lib/i18n/sr.json`, `src/lib/i18n/en.json` — every user-facing string goes in both |
| Schema and migrations | `prisma/schema.prisma`, `prisma/migrations/` |
| City seed | `prisma/seed.ts`, run with `npx prisma db seed` |
| Tests | `tests/` (Jest + ts-jest + supertest; Prisma is mocked with `jest.mock('@/app/utils/db')`) |

Dates are shown in `Europe/Belgrade` via Luxon. Company accounts have a status
(`PENDING` / `ACTIVE` / `DISABLED`); only `ACTIVE` companies may log in or manage trips.

## Checks and the current baseline

| Check | Command | Baseline (2026-11-05) |
|---|---|---|
| Types | `npx tsc --noEmit` | 0 errors |
| Tests | `npx jest` | 30 passing; 3 of 5 suites fail to load (`auth`, `reservations`, `routes`) because `tests/setup.ts` does not set `RESEND_API_KEY` |
| Lint | `npm run lint` | Not usable: ESLint was never configured, and `next lint` stops at an interactive prompt |

Compare against this baseline before and after a change. A change must not add
type errors, lose passing tests, or break a suite that loaded before. Update this
table when the baseline legitimately moves.

What the checks do **not** cover: page rendering, components, real database
queries, email delivery, auth cookies in a browser. Anything touching those needs a
person to look.

## Git

- Branch from `main` as `<type>/<kebab-description>` (`feat`, `fix`, `refactor`, `chore`, `docs`). PRs target `main`.
- Never commit, push or merge unless the user asks for that command explicitly.
- `main` deploys production. Migrations in `prisma/migrations/` run against the production Neon database.

## Agent workflow

The main session acts as **coordinator**. It takes a task from any source (a GitHub
issue, a message, a written brief), routes it, and tracks it to a pull request.
Agents are defined in `.claude/agents/`.

```
task ─▶ triage ─▶ person approves brief ─▶ verifiable? ─ yes ─▶ implementer ─▶ reviewer ─▶ person merges
                                                     └─ no ──▶ person implements (brief already done) ─▶ reviewer
```

0. **Check the scratchpad, then explore cheaply.** Read `.claude/scratchpad/INDEX.md`
   before investigating anything; reuse a recorded finding instead of re-reading code.
   For any search that spans several files or directories, delegate to the built-in
   `Explore` agent (say "medium" or "very thorough") and keep only its conclusion in
   context. Read files directly only when you already know the exact file and range.
1. **Triage first, always.** Send every non-trivial task to `triage`. Show the brief
   to the user and get their answers to its open questions before any code is written.
2. **Route by verifiability, not task type.** Only send a task to `implementer` when
   triage named a failing test that would prove it done. "The page looks wrong" does
   not qualify; config changes, renames and threading a value through call sites do.
3. **Review every change** with `reviewer`, whether an agent or a person wrote it.

### Controls every agent follows

1. Agents never commit, push or merge. A person does.
2. An automated change touches at most 8 files. Anything larger goes back to triage to be split.
3. Test-first: write the failing test, watch it fail, then make it pass.
4. Compare type errors and test counts before and after, against the baseline above.
5. Every agent report ends with what it did **not** verify.

### Scratchpad: findings that outlive one question

`.claude/scratchpad/` holds working notes that persist between questions and sessions.
It is git-ignored: local memory, not documentation.

- `INDEX.md` — one line per findings file: `- [topic](findings/<topic>.md) — hook (YYYY-MM-DD)`.
- `findings/<topic>.md` — one topic per file (e.g. `auth-flow.md`, `reservation-seats.md`,
  `test-baseline.md`). Facts with `file:line` references, the date checked, and the
  commit (`git rev-parse --short HEAD`) they were true at.

Rules for every agent and the coordinator:
- **Before** exploring: read `INDEX.md` and any relevant findings file. If a finding's
  files changed since its commit (`git diff --stat <commit> -- <files>`), re-verify it.
- **After** an investigation, review or implementation: add or update the findings file
  with what was learned that a later question would need. Update in place; delete
  findings that turn out wrong. Do not copy code, only the conclusion and where it lives.
- `Explore` cannot write files, so the coordinator records what Explore found.
- Triage briefs go in `briefs/<short-task-name>.md` so the implementer and reviewer can
  read the approved brief instead of having it pasted again.
