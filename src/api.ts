export type Book = {
  id: string;
  title: string;
  author: string;
  page_count: number;
  cover_url: string | null;
  created_at: string;
};
const API_BASE_URL = "http://localhost:3001";

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/api/books`);

  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }
  return response.json();
}
