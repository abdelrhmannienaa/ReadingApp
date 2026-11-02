import { daysAgoKey, toDateKey } from "@/lib/reading-stats";
import { supabase } from "@/lib/supabase";
import { Platform } from "react-native";

// A book saved in the shared books table.
export type Book = {
  id: string;
  title: string;
  author: string;
  page_count: number | null;
  cover_url: string | null;
  created_at: string;
};

// A lightweight book result returned by Open Library search.
export type SearchBook = {
  open_library_id: string;
  title: string;
  author: string;
  page_count: number | null;
  cover_url: string | null;
};

// Full details returned by the backend for one Open Library work.
export type BookDetails = {
  open_library_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string;
};

// A book in one particular user's library.
// It includes user-specific fields like reading status and progress.
export type LibraryBook = {
  user_book_id: string;
  status: string;
  current_page: number;
  book: {
    id: string;
    title: string;
    author: string;
    page_count: number | null;
    cover_url: string | null;
    open_library_id: string;
  };
};

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

// Gets every shared book from the Express backend.
// Do not use this for a person's personal Profile/Library screen.
export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/api/books`);

  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }

  return response.json();
}

// Searches Open Library through your Express backend.
export async function searchBooks(query: string): Promise<SearchBook[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to search books");
  }

  return response.json();
}

export async function fetchBookDetails(workId: string): Promise<BookDetails> {
  const response = await fetch(
    `${API_BASE_URL}/api/books/details/${encodeURIComponent(workId)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch book details");
  }

  return response.json();
}

// Adds a book to the currently signed-in user's library.
export async function addBookToLibrary(book: BookDetails): Promise<void> {
  // Step 1: identify the currently signed-in user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to add a book.");
  }

  // Step 2: see whether this book already exists in the shared books table.
  const { data: existingBook, error: findBookError } = await supabase
    .from("books")
    .select("id")
    .eq("open_library_id", book.open_library_id)
    .maybeSingle();

  if (findBookError) {
    throw new Error(findBookError.message);
  }

  let bookId = existingBook?.id;

  if (!bookId) {
    const { data: newBook, error: insertBookError } = await supabase
      .from("books")
      .insert({
        open_library_id: book.open_library_id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
      })
      .select("id")
      .single();

    if (insertBookError) {
      throw new Error(insertBookError.message);
    }

    if (!newBook) {
      throw new Error("Could not create the book.");
    }

    bookId = newBook.id;
  }

  // Step 4: create the PERSONAL library row.
  // This runs whether the shared book was new or already existed.
  const { error: userBookError } = await supabase.from("user_books").insert({
    user_id: user.id,
    book_id: bookId,
    status: "want_to_read",
    current_page: 0,
  });

  if (userBookError) {
    throw new Error(userBookError.message);
  }
}

// Gets only the books saved by the CURRENT signed-in user.
export async function fetchMyLibrary(): Promise<LibraryBook[]> {
  // First, determine whose library we are loading.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to view your library.");
  }

  // Get this user's user_books rows and the matching shared book for each row.
  const { data, error } = await supabase
    .from("user_books")
    .select(
      `
      id,
      status,
      current_page,
      books (
        id,
        title,
        author,
        page_count,
        cover_url,
        open_library_id
      )
    `,
    )
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      // Depending on Supabase's relation inference, `books` can appear
      // as one object or as an array containing one object.
      const relatedBook = Array.isArray(row.books) ? row.books[0] : row.books;

      // Do not send an incomplete library entry to the screen.
      if (!relatedBook) {
        return null;
      }

      return {
        user_book_id: row.id,
        status: row.status,
        current_page: row.current_page,
        book: relatedBook as LibraryBook["book"],
      };
    })
    .filter((libraryBook): libraryBook is LibraryBook => libraryBook !== null);
}

// The dashboard needs a year of sessions so a long streak is counted correctly,
// even though the habit grid only shows the last 16 weeks.
const SESSION_HISTORY_DAYS = 366;

export type CurrentRead = {
  book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  // Null when we don't know the book's length, so check before showing "x/y".
  page_count: number | null;
  current_page: number;
  status: string;
};

export type ReadingSession = {
  book_id: string;
  minutes: number;
  read_on: string;
  created_at: string;
};

export type DashboardData = {
  displayName: string;
  books: CurrentRead[];
  sessions: ReadingSession[];
};

type UserBookRow = {
  book_id: string;
  status: string;
  current_page: number | null;
  books: {
    title: string;
    author: string;
    cover_url: string | null;
    page_count: number | null;
  };
};

async function getSignedInUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }
  return user;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const user = await getSignedInUser();

  const { data: userBooks, error: userBooksError } = await supabase
    .from("user_books")
    .select(
      "book_id, status, current_page, books(title, author, cover_url, page_count)",
    )
    .eq("user_id", user.id)
    .in("status", ["reading", "want_to_read"]);

  if (userBooksError) {
    throw new Error(userBooksError.message);
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("reading_sessions")
    .select("book_id, minutes, read_on, created_at")
    .eq("user_id", user.id)
    .gte("read_on", daysAgoKey(new Date(), SESSION_HISTORY_DAYS))
    .order("created_at", { ascending: false });

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  // Sessions are newest first, so the first one seen for a book is its latest.
  const lastReadAt = new Map<string, string>();
  for (const session of sessions) {
    if (!lastReadAt.has(session.book_id)) {
      lastReadAt.set(session.book_id, session.created_at);
    }
  }

  // supabase-js can't tell that each user_books row has exactly one book
  // without generated database types, so we describe the row shape ourselves.
  const rows = (userBooks ?? []) as unknown as UserBookRow[];

  const books = rows.map((row) => ({
    book_id: row.book_id,
    status: row.status,
    current_page: row.current_page ?? 0,
    ...row.books,
  }));

  // Books being read come before unstarted ones, most recently read first.
  books.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "reading" ? -1 : 1;
    }
    const aLast = lastReadAt.get(a.book_id) ?? "";
    const bLast = lastReadAt.get(b.book_id) ?? "";
    return bLast.localeCompare(aLast);
  });

  return {
    displayName:
      user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "reader",
    books,
    sessions,
  };
}

export async function logReadingSession(input: {
  book: CurrentRead;
  minutes: number;
  page: number;
}): Promise<void> {
  const { book, minutes, page } = input;
  const user = await getSignedInUser();

  const isFinished = book.page_count !== null && page >= book.page_count;

  // Update the book first. Saving the same page twice is harmless, so if the
  // session insert below fails, trying again won't double count anything.
  const { data: updatedBooks, error: updateError } = await supabase
    .from("user_books")
    .update({
      current_page: page,
      status: isFinished ? "finished" : "reading",
    })
    .eq("user_id", user.id)
    .eq("book_id", book.book_id)
    .select("book_id");

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Row Level Security blocks an update by matching zero rows, not with an error.
  if (!updatedBooks?.length) {
    throw new Error("Could not update your progress on this book.");
  }

  const { error: insertError } = await supabase
    .from("reading_sessions")
    .insert({
      user_id: user.id,
      book_id: book.book_id,
      minutes,
      page_reached: page,
      read_on: toDateKey(new Date()),
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
