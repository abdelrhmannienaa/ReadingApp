# Testing

Reademption uses Jest with the Expo `jest-expo` preset for its test runner and
React Native Testing Library for UI tests. Run the full suite from the project
root with:

```sh
npm test
```

Install the project dependencies first with `npm install`. The tests do not
need Supabase credentials, Open Library access, seed data, or a running backend:
external boundaries are mocked so they are deterministic.

## Test levels

- **Unit tests** in `src/lib/__tests__/reading-stats-test.ts` exercise the pure
  reading-statistics helpers. They cover goal selection, day-status boundaries,
  session aggregation/streak calculation, and future-day grid state.
  `reading-validation-test.ts` also covers a valid reading entry, the new
  no-backtracking rule, and the session-duration limit.
- **System tests** in `src/__tests__/api-system-test.ts` cover the complete
  `logReadingSession` application flow across authentication, the user-book
  update, and the reading-session insert. The two tests confirm both normal
  progress and finishing a book.
- **UI tests** in `src/components/dashboard/__tests__/` render the goal and
  reading-log forms as a user sees them. They verify validation feedback and
  successful submissions through buttons and inputs, rather than component
  state.

## Test-by-test checklist

The suite currently contains **16 tests**. This list explains exactly what
each one proves.

### Unit tests

#### `src/lib/__tests__/reading-stats-test.ts`

1. **Uses the latest goal active on a date** — confirms a goal change only
   affects that day and later days; earlier dates retain the prior goal.
2. **Labels 0 minutes as unmet** — confirms no reading time does not meet a
   30-minute goal.
3. **Labels 10 minutes as partial** — confirms some reading below the goal is
   shown as partial progress.
4. **Labels 30 minutes as met** — confirms exactly meeting a 30-minute goal
   is successful.
5. **Labels 45 minutes as exceeded** — confirms reading 1.5 times the goal is
   classified as exceeded.
6. **Adds same-day sessions before calculating a streak** — confirms two
   sessions on one day combine before the streak is calculated, resulting in a
   two-day streak in the provided example.
7. **Marks days after today as future in the habit grid** — confirms future
   days cannot appear as missed reading days.

#### `src/lib/__tests__/reading-validation-test.ts`

8. **Accepts a valid reading entry** — confirms a positive duration and a
   forward page number within the book's page count can be saved.
9. **Rejects a page earlier than saved progress** — confirms a reader on page
   8 cannot accidentally submit page 7 and move their progress backward.
10. **Rejects more than one day of reading** — confirms a reading session over
    1,440 minutes is rejected.

### System tests

#### `src/__tests__/api-system-test.ts`

11. **Updates progress, then records a dated reading session** — confirms
    `logReadingSession` gets the signed-in user, updates `user_books` to page
    42 with status `reading`, and inserts a 25-minute session dated
    `2026-11-15`.
12. **Marks a book finished on its final page** — confirms submitting page 300
    for a 300-page book updates its status to `finished` before recording the
    session.

### UI tests

#### `src/components/dashboard/__tests__/goal-sheet-test.tsx`

13. **Shows validation for an invalid daily goal** — confirms entering `0`
    displays an error and does not call the goal-saving API.
14. **Saves a goal selected from a preset** — confirms a reader can choose the
    visible `30 min` preset, press **Save Goal**, and submit 30 minutes.

#### `src/components/dashboard/__tests__/log-reading-sheet-test.tsx`

15. **Shows validation for a page past the end of a book** — confirms entering
    page 101 for a 100-page book displays an error and does not save.
16. **Logs a session from a quick-minute control** — confirms a reader can
    choose the visible `15 min` button, keep their current page, press **Save**,
    and submit the expected reading-session data.

## TDD record: prevent accidental progress backtracking

**Requirement:** A reading entry must not save a page lower than the reader's
current page; this avoids accidentally moving their saved place backwards.

**Red:** The initial `getReadingEntryError` unit test submitted page 7 for a
reader already on page 8. It expected a clear error but failed because the UI
only checked for negative pages and pages beyond the book's end.

**Green:** The validation helper now returns “Page reached cannot be earlier
than your current page.” when `page < currentPage`.

**Refactor:** The sheet delegates all of its reading-entry validation to
`getReadingEntryError`, keeping the UI event handler focused on submission and
making the rule independently testable.

## Limitations and future work

The system tests mock Supabase, so they verify the application orchestration
but not the live database schema or row-level-security policies. A future
integration suite should run against a disposable Supabase project. Browser or
device end-to-end tests can additionally validate navigation and native
keyboard behavior.
