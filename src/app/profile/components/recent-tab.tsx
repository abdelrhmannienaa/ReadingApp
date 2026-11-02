import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { fetchMyLibrary, type LibraryBook } from "../../../api";

export default function RecentTab() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooks() {
      try {
        // Get only the signed-in user's library, then show up to five books.
        const data = await fetchMyLibrary();
        setBooks(data.slice(0, 5));
      } catch {
        setError("Could not load your recent books. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  return (
    <View>
      {loading && (
        <ActivityIndicator size="large" color="#A78BFA" style={styles.loader} />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && books.length === 0 ? (
        <Text style={styles.emptyText}>
          Your library is empty. Add a book from Explore.
        </Text>
      ) : null}

      {books.map((libraryBook) => {
        const book = libraryBook.book;

        return (
          <View key={libraryBook.user_book_id} style={styles.bookCard}>
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverText}>
                {book.title.slice(0, 2).toUpperCase()}
              </Text>
            </View>

            <View style={styles.bookDetails}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.author}>{book.author}</Text>

              <Text style={styles.pageCount}>
                {book.page_count !== null
                  ? `${book.page_count} pages`
                  : "Page count unavailable"}
              </Text>

              <Text style={styles.pageCount}>
                Status: {libraryBook.status.replaceAll("_", " ")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 32,
  },
  bookCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    gap: 16,
  },
  coverPlaceholder: {
    width: 64,
    height: 92,
    borderRadius: 8,
    backgroundColor: "#5B21B6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  bookDetails: {
    flex: 1,
    justifyContent: "center",
  },
  bookTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "600",
    marginBottom: 4,
  },
  author: {
    color: "#A1A1AA",
    fontSize: 14,
    marginBottom: 14,
  },
  pageCount: {
    color: "#D4D4D8",
    fontSize: 13,
    marginBottom: 3,
  },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 15,
    textAlign: "center",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 15,
    textAlign: "center",
  },
});
