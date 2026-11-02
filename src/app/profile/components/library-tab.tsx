import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

import { fetchBooks, type Book } from "../../../api";

export default function LibraryTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (err) {
        setError("Could not load books. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  return (
    <View>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#A78BFA"
          style={styles.loader}
        />
      )}

      {error ? <Text style={styles.message}>{error}</Text> : null}

      {!loading && !error && books.length === 0 ? (
        <Text style={styles.message}>No books have been added yet.</Text>
      ) : null}

      <View style={styles.grid}>
        {books.map((book) => (
          <View key={book.id} style={styles.gridItem}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={styles.coverText}>
                  {book.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.bookTitle} numberOfLines={2}>
              {book.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 32,
  },
  message: {
    color: "#A78BFA",
    textAlign: "center",
    marginVertical: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "31%", // 3 columns; change to 48% for 2
    marginBottom: 16,
  },
  cover: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    backgroundColor: "#757474",
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  bookTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
});
