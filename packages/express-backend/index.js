import cors from "cors";
import "dotenv/config";
import express from "express";
import { supabase } from "./supabase.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Reademption backend is running" });
});

app.get("/api/books", async (req, res) => {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.get("/api/books/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({
      error: "Please include a search query, such as ?q=harry+potter",
    });
  }
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data from Open Library API");
    }
    const results = await response.json();
    const books = results.docs.slice(0, 10).map((book) => ({
      open_library_id: book.key,
      title: book.title || "Untitled",
      author: book.author_name?.[0] || "Unknown Author",
      page_count: book.number_of_pages_median || 0,
      cover_url: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : null,
    }));
    res.json(books);
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching data from the Open Library API",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
