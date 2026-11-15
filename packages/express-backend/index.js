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
      page_count: book.number_of_pages_median || null,
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

app.get("/api/books/details/:workId", async (req, res) => {
  const { workId } = req.params;

  try {
    const response = await fetch(
      `https://openlibrary.org/works/${workId}.json`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data from Open Library API");
    }

    const work = await response.json();

    const editionsResponse = await fetch(
      `https://openlibrary.org/works/${workId}/editions.json?limit=50`,
    );

    const editions = editionsResponse.ok
      ? await editionsResponse.json()
      : { entries: [] };

    // Use the first edition that reports a numeric page total.
    const pageCount =
      editions.entries?.find(
        (edition) => typeof edition.number_of_pages === "number",
      )?.number_of_pages ?? null;

    let author = "Unknown Author";
    const authorKey = work.authors?.[0]?.author?.key;

    if (authorKey) {
      const authorResponse = await fetch(
        `https://openlibrary.org${authorKey}.json`,
      );

      if (authorResponse.ok) {
        const authorData = await authorResponse.json();
        author = authorData.name || author;
      }
    }

    const rawDescription =
      typeof work.description === "string"
        ? work.description
        : work.description?.value ||
          "No description is available for this book.";

    const description = rawDescription.split(/\n\s*-{3,}\s*\n/)[0].trim();

    res.json({
      open_library_id: `/works/${workId}`,
      title: work.title || "Untitled",
      cover_url: work.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg`
        : null,
      author,
      description,
      page_count: pageCount,
    });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching data from the Open Library API",
      details: error.message,
    });
  }
});

app.get("/api/books/discover", async (req, res) => {
  const allowedSubjects = [
    "fantasy",
    "horror",
    "nonfiction",
    "mystery",
    "romance",
    "science_fiction",
  ];

  // Only accept categories intentionally supported by this app.
  const subject = allowedSubjects.includes(req.query.subject)
    ? req.query.subject
    : "fantasy";

  // Read the requested page of books, defaulting safely to the first page.
  const requestedOffset = Number.parseInt(req.query.offset, 10);

  // Restrict the offset to 0–90: 10 possible groups of 10 books.
  const offset = Number.isNaN(requestedOffset)
    ? 0
    : Math.min(Math.max(requestedOffset, 0), 90);

  try {
    const response = await fetch(
      `https://openlibrary.org/subjects/${subject}.json?limit=10&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch discovery books from Open Library");
    }

    const results = await response.json();

    // Convert Open Library's subject response into our SearchBook shape.
    const books = (results.works ?? []).map((book) => ({
      open_library_id: book.key,
      title: book.title || "Untitled",
      author: book.authors?.[0]?.name || "Unknown Author",
      page_count: null,
      cover_url: book.cover_id
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
        : null,
    }));

    res.json(books);
  } catch (error) {
    res.status(500).json({
      error: "Could not load discovery books.",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
