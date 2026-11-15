import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { fetchDiscoverBooks, type SearchBook, searchBooks } from "../../api";

type DiscoverSection = {
  title: string;
  subject: string;
  books: SearchBook[];
};

const DISCOVER_CATEGORIES = [
  { title: "Fantasy Books", subject: "fantasy" },
  { title: "Horror Books", subject: "horror" },
  { title: "Nonfiction Books", subject: "nonfiction" },
  { title: "Mystery Books", subject: "mystery" },
  { title: "Romance Books", subject: "romance" },
  { title: "Science Fiction Books", subject: "science_fiction" },
];

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<SearchBook[]>([]);
  const [discoverSections, setDiscoverSections] = useState<DiscoverSection[]>(
    [],
  );
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function loadDiscoverSections() {
      setLoading(true);
      setError("");

      try {
        const loadedSections: DiscoverSection[] = [];

        // Load each genre's books and store them as a separate section.
        for (const category of DISCOVER_CATEGORIES) {
          // Randomly choose 0, 10, 20, ... 90.
          const randomOffset = Math.floor(Math.random() * 10) * 10;

          const categoryBooks = await fetchDiscoverBooks(
            category.subject,
            randomOffset,
          );

          loadedSections.push({
            ...category,
            books: categoryBooks,
          });
        }

        setDiscoverSections(loadedSections);
      } catch {
        setError("Could not load books to discover. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadDiscoverSections();
  }, []);

  async function handleSearch() {
    const trimmedQuery = query.trim();

    // An empty search returns the user to the Discover sections.
    if (!trimmedQuery) {
      setShowingSearchResults(false);
      return;
    }

    setError("");
    setLoading(true);
    setShowingSearchResults(true);
    setBooks([]);

    try {
      const searchResults = await searchBooks(trimmedQuery);
      setBooks(searchResults);
    } catch {
      setError("Failed to search books. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function openBookDetails(book: SearchBook) {
    const workId = book.open_library_id.replace("/works/", "");

    router.push({
      pathname: "/explore/[workId]",
      params: { workId },
    });
  }

  function renderCover(book: SearchBook, style = styles.bookCover) {
    if (book.cover_url) {
      return <Image source={{ uri: book.cover_url }} style={style} />;
    }

    return (
      <View style={[style, styles.coverPlaceholder]}>
        <Text style={styles.coverText}>
          {book.title.slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Discover Your Next Read</Text>

        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);

            // Clearing the search box returns to the genre sections.
            if (!text.trim()) {
              setShowingSearchResults(false);
            }
          }}
          onSubmitEditing={handleSearch}
          placeholder="Search by title or author"
          placeholderTextColor="#A78BFA"
          style={styles.searchInput}
        />

        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#A78BFA"
            style={styles.loader}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && showingSearchResults && (
          <>
            <Text style={styles.resultsCount}>{books.length} books found</Text>

            {books.length === 0 ? (
              <Text style={styles.emptyText}>
                No books matched that search.
              </Text>
            ) : (
              <View style={styles.searchResults}>
                {books.map((book) => (
                  <Pressable
                    key={book.open_library_id}
                    style={styles.searchBookCard}
                    onPress={() => openBookDetails(book)}
                  >
                    {renderCover(book)}

                    <View style={styles.bookDetails}>
                      <Text style={styles.bookTitle}>{book.title}</Text>
                      <Text style={styles.bookAuthor}>by {book.author}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        {!loading && !error && !showingSearchResults && (
          <View>
            {discoverSections.map((section) => (
              <View key={section.subject} style={styles.discoverSection}>
                <Text style={styles.sectionTitle}>{section.title}</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalBookList}
                >
                  {section.books.map((book) => (
                    <Pressable
                      key={book.open_library_id}
                      style={styles.discoverBookCard}
                      onPress={() => openBookDetails(book)}
                    >
                      {renderCover(book, styles.discoverCover)}

                      <Text style={styles.discoverBookTitle} numberOfLines={2}>
                        {book.title}
                      </Text>

                      <Text style={styles.discoverBookAuthor} numberOfLines={1}>
                        {book.author}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
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
    paddingHorizontal: 24,
    backgroundColor: "#121212",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
  },
  searchInput: {
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: "#A78BFA",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "700",
  },
  loader: {
    marginTop: 32,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 15,
    marginTop: 16,
  },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 15,
    marginTop: 16,
  },
  resultsCount: {
    color: "#A78BFA",
    marginTop: 20,
    fontSize: 16,
  },
  searchResults: {
    marginTop: 8,
  },
  searchBookCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#1E1E1E",
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  bookCover: {
    width: 90,
    height: 130,
    borderRadius: 8,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    backgroundColor: "#5B21B6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  bookDetails: {
    flex: 1,
    justifyContent: "center",
  },
  bookTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  bookAuthor: {
    color: "#A1A1AA",
    fontSize: 15,
    marginTop: 6,
  },
  discoverSection: {
    marginTop: 28,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 12,
  },
  horizontalBookList: {
    gap: 14,
    paddingRight: 24,
  },
  discoverBookCard: {
    width: 120,
  },
  discoverCover: {
    width: 120,
    height: 180,
    borderRadius: 10,
    resizeMode: "cover",
  },
  discoverBookTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  discoverBookAuthor: {
    color: "#A1A1AA",
    fontSize: 13,
    marginTop: 3,
  },
});
