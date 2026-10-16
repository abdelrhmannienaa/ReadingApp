import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type SearchBook, searchBooks } from "../api";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<SearchBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }
    setError("");
    setLoading(true);

    try {
      const searchResults = await searchBooks(trimmedQuery);
      setBooks(searchResults);
    } catch (err) {
      setError("Failed to search books. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>What's your next read?</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Search by title or author"
          style={styles.searchInput}
          placeholderTextColor="#A78BFA"
        />
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.baseText}>Search</Text>
        </Pressable>
        {books.length > 0 && (
          <Text style={styles.resultsCount}>{books.length} books found</Text>
        )}
        {loading && (
          <ActivityIndicator
            size="large"
            color="#A78BFA"
            style={styles.loader}
          />
        )}
        {error ? <Text style={styles.baseText}>{error}</Text> : null}
        {!loading && (
          <View>
            {books.map((book) => (
              <View key={book.open_library_id} style={styles.bookCard}>
                {book.cover_url ? (
                  <Image
                    source={{ uri: book.cover_url }}
                    style={styles.bookCover}
                  />
                ) : null}
                <View style={styles.bookDetails}>
                  <Text style={styles.baseText}>{book.title}</Text>
                  <Text style={styles.baseText}>by {book.author}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#121212",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "System",
  },
  searchInput: {
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  resultsCount: {
    color: "#A78BFA",
    marginTop: 16,
    fontSize: 16,
  },
  bookItem: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 12,
  },
  bookCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#757474",
    padding: 5,
    borderRadius: 14,
    marginBottom: 8,
  },
  bookCover: {
    width: 130,
    height: 175,
    marginBottom: 5,
    resizeMode: "contain",
  },
  loader: {
    marginTop: 32,
  },
  bookDetails: {
    flex: 1,
    justifyContent: "flex-start",
    fontFamily: "Cooper Black",
  },
  searchButton: {
    backgroundColor: "#757474",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: "contain",
  },
  baseText: {
    fontFamily: "Cooper Black",
    fontSize: 16,
    color: "#1c1212",
    fontWeight: "700",
  },
});
