# TE 4 — Design and Architectural Patterns

The mobile app is the presentation tier. Supabase (managed Postgres + Auth) is the data tier, and the app reads and writes it directly through `supabase-js`, protected by Row Level Security. The one piece of real server-side logic, the spoiler-safe companion, lives in its own Python FastAPI service.

**Why it fits:**

- Most of the app is simple CRUD (books on a shelf, reading sessions, goals). Supabase handles that without us writing or hosting an API for it.
- The companion needs Python's ML stack (embeddings, vector search) and must enforce spoiler safety on the server, where a client cannot bypass it.
- Each tier can change on its own: we can redesign screens without touching the database, or swap the LLM provider without touching the app.

&#91;embedded content: architecture · layered client-server, 2 external systems\]

**Direction of communication:** the client always initiates. It calls Open Library for search, Supabase for auth and data, and the Companion API for questions (sending its Supabase JWT). The Companion API verifies the JWT, queries Supabase for the reader's position and allowed text chunks, then calls the LLM API. No component calls back up into the client.

## 2. High-Level Design Diagram

Four screens sit on a shared layer of service modules; that layer is the only code that talks to Open Library, Supabase or the Companion API.

&#91;embedded content: Nightstand high-level design · 4 screens, 1 service layer, 2 backends, 2 external APIs\]

**Key data flows:**

1. **Add a book:** Search screen → `bookService` → Open Library `search.json` → results mapped to our `Book` type → user picks one → row saved to `user_books` in Supabase.
2. **Log a session:** Log Session sheet → `sessionService` inserts into `reading_sessions` (minutes read, chapter reached). RLS ensures a user can write only their own rows.
3. **Show the habit grid:** Habit Grid → `goalService` sums minutes per day from `reading_sessions` and compares each day to the user's goal → missed / met / exceeded.
4. **Ask the companion:** Companion Chat → `companionClient` sends `POST /companion/ask` with the question and Supabase JWT → FastAPI verifies the JWT, looks up the reader's current chapter, retrieves only `book_chunks` at or before it, builds the prompt, calls the LLM → answer returned to the app.
5. **Ingest a book (planned, offline):** script splits a public-domain text into chapter-tagged chunks, embeds them, and writes them to `book_chunks`.

## 3. Design Pattern: Adapter (Planned)

**Status: Planned.** Our prototype calls Open Library with `fetch` directly inside the search component. We will refactor that call behind an Adapter before building more screens on top of it.

### Problem it solves

Open Library's API returns its own shape: `docs[]` with fields like `key`, `author_name[]`, `cover_i` and `first_publish_year`. If screens use that shape directly, Open Library's field names leak into the Shelf, Search and Log screens and into the rows we save in Supabase. Swapping or adding a source (for example Google Books, for ISBNs Open Library lacks) would mean editing every one of those places.

The Adapter converts Open Library's interface into the one interface our app expects, a `BookSource` that returns our own `Book` type.

### Participants

| GoF role | Our module                            | Responsibility                                         |
| -------- | ------------------------------------- | ------------------------------------------------------ |
| Target   | `BookSource` (TypeScript interface)   | What the app needs: `search(query)` returning `Book[]` |
| Adapter  | `OpenLibraryAdapter`                  | Calls Open Library, maps its JSON to `Book`            |
| Adaptee  | Open Library REST API (`search.json`) | Third-party API we don't control                       |
| Client   | `bookService`, used by `SearchScreen` | Depends only on `BookSource`, never on Open Library    |

### UML sketch

```text
          «interface» BookSource
          + search(query: string): Promise<Book[]>
                     ▲
                     │ implements
          OpenLibraryAdapter ────── calls ──────▶  Open Library API (adaptee)
          + search(query)                             GET /search.json
          - toBook(doc: OLDoc): Book

  SearchScreen ── calls ──▶ bookService ── depends on ──▶ BookSource
  (tests)  FakeBookSource implements BookSource
```

### Code sketch (TypeScript)

```ts
// domain/book.ts — the shape the whole app uses
export interface Book {
  id: string; // e.g. "ol:OL45883W"
  title: string;
  authors: string[];
  coverUrl?: string;
  firstPublished?: number;
}

// ports/BookSource.ts — Target
export interface BookSource {
  search(query: string): Promise<Book[]>;
}

// adapters/OpenLibraryAdapter.ts — Adapter
type OLDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
};

export class OpenLibraryAdapter implements BookSource {
  async search(query: string): Promise<Book[]> {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
    const json: { docs: OLDoc[] } = await (await fetch(url)).json();
    return json.docs.map(toBook);
  }
}

function toBook(d: OLDoc): Book {
  return {
    id: `ol:${d.key.replace("/works/", "")}`,
    title: d.title,
    authors: d.author_name ?? [],
    coverUrl: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
      : undefined,
    firstPublished: d.first_publish_year,
  };
}

// services/bookService.ts — Client (source is injectable for tests)
export const makeBookService = (
  source: BookSource = new OpenLibraryAdapter(),
) => ({
  search: (q: string) => source.search(q.trim()),
});
```

### Why this beats one large component

- **One place to change.** If Open Library changes a field or we add Google Books, only the adapter changes; screens and database rows keep using `Book`.
- **Testable without the network.** Tests pass a `FakeBookSource` into `makeBookService`, so the Search screen can be tested offline and deterministically.
- **Clean data in Supabase.** We store our own `Book` fields, not a third party's response format.
- **Smaller components.** The Search screen handles input and display only; mapping and HTTP live elsewhere.

We plan to apply the same pattern on the Python side: an `LLMClient` interface with one adapter per model provider, so the companion's retrieval logic doesn't depend on any one vendor's SDK.

## 4. Design Decisions and Tradeoffs

### Decision 1: Supabase instead of a custom backend

- **Options considered:** (a) Node/Express API with our own auth and a Postgres or MongoDB database; (b) Firebase (Auth + Firestore); (c) Supabase (Auth + Postgres + Row Level Security).
- **Selected:** Supabase.
- **Why it fits now:** Our data is relational: users have books, books have reading sessions, sessions roll up into daily goal status for the habit grid. That is a natural SQL query and an awkward one in a document store like Firestore. Supabase also gives us sign-in and per-user security (RLS) without writing or hosting an API, and its `pgvector` extension lets the companion's text chunks live in the same database.
- **Tradeoff:** We depend on one vendor, and security rules live in SQL policies rather than application code. We keep this contained by routing every Supabase call through client service modules, so moving later would touch those modules, not the screens.

### Decision 2: A separate Python (FastAPI) service for the AI companion

- **Options considered:** (a) call the LLM directly from the mobile app; (b) Supabase Edge Functions in TypeScript; (c) a separate FastAPI service in Python.
- **Selected:** FastAPI service.
- **Why it fits now:** Option (a) would put our LLM API key on users' phones and let the client skip spoiler filtering. Python lets us reuse the embedding and retrieval work from our earlier book-recommendation prototype (`sentence-transformers`, `all-MiniLM-L6-v2`), which has no clean equivalent in Edge Functions.
- **Tradeoff:** A second service to deploy and monitor, and two services that must agree on auth. We handle auth by having FastAPI verify the same Supabase JWT the app already holds, so there is still one login.

### Decision 3: Enforce spoiler safety in retrieval, not just in the prompt

- **Options considered:** (a) send the model the whole book and instruct it not to spoil past chapter N; (b) filter retrieved passages to chapters at or before the reader's logged chapter, so later text never reaches the model.
- **Selected:** Retrieval filtering (b), with a prompt instruction as a second layer.
- **Why it fits now:** Spoilers are the one failure that would make readers distrust the companion. A model can ignore an instruction, but it cannot reveal text it never received. The filter is also a plain database condition (`chapter <= :current_chapter`) we can unit test.
- **Tradeoff:** We need full text split into chapter-tagged chunks, so the companion works only for books we have ingested, starting with public-domain titles. Tracking still works for every book via Open Library.
