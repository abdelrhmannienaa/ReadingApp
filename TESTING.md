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
