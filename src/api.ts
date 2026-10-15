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
