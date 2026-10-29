import { supabase } from "@/lib/supabase";
import { Platform } from "react-native";
export type Book = {
  id: string;
  title: string;
  author: string;
  page_count: number;
  cover_url: string | null;
  created_at: string;
};
export type SearchBook = {
  open_library_id: string;
  title: string;
  author: string;
  page_count: number | null;
  cover_url: string | null;
};
export type BookDetails = {
  open_library_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string;
};

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/api/books`);

  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }
  return response.json();
}
// this basically searches a book by title or author and returns the results
// input -> request -> check -> return
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
export async function addBookToLibrary(book: BookDetails): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to add a book.");
  }

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
}
