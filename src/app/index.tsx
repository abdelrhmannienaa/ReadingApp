import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchBooks, type Book } from "../api";

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (error) {
        setError("Could not load books. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>YOUR READING SPACE</Text>
          <Text style={styles.title}>Reademption</Text>
          <Text style={styles.subtitle}>Your library, all in one place.</Text>
        </View>

        <Text style={styles.sectionTitle}>Books in your library</Text>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#A78BFA"
            style={styles.loader}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && books.length === 0 ? (
          <Text style={styles.emptyText}>No books have been added yet.</Text>
        ) : null}

        {books.map((book) => (
          <View key={book.id} style={styles.bookCard}>
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverText}>
                {book.title.slice(0, 2).toUpperCase()}
              </Text>
            </View>

            <View style={styles.bookDetails}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.author}>{book.author}</Text>
              <Text style={styles.pageCount}>{book.page_count} pages</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 24,
    marginBottom: 40,
  },
  eyebrow: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 14,
  },
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
  },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 15,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 15,
  },
});
