import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchMyLibrary, type LibraryBook } from "@/api";
import { Palette } from "@/constants/palette";

export default function LibraryTab() {
  const router = useRouter();

  // This holds user-specific library entries, not global Book rows.
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await fetchMyLibrary();
        setBooks(data);
      } catch {
        setError("Could not load your library. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  function openBookDetails(openLibraryId: string) {
    // Turns "/works/OL123W" into "OL123W" for the dynamic route.
    const workId = openLibraryId.replace("/works/", "");

    router.push({
      pathname: "/explore/[workId]",
      params: { workId },
    });
  }

  return (
    <View>
      {loading && (
        <ActivityIndicator
          size="large"
          color={Palette.red}
          style={styles.loader}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && books.length === 0 ? (
        <Text style={styles.message}>
          Your library is empty. Add a book from Search.
        </Text>
      ) : null}

      <View style={styles.grid}>
        {books.map((libraryBook) => {
          const book = libraryBook.book;

          return (
            <Pressable
              key={libraryBook.user_book_id}
              style={({ pressed }) => [
                styles.gridItem,
                pressed && styles.pressed,
              ]}
              onPress={() => openBookDetails(book.open_library_id)}
              accessibilityRole="button"
              accessibilityLabel={book.title}
            >
              {book.cover_url ? (
                <Image
                  source={{ uri: book.cover_url }}
                  style={styles.cover}
                  accessibilityLabel={`Cover of ${book.title}`}
                />
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 32,
  },
  message: {
    color: Palette.muted,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 16,
  },
  error: {
    color: Palette.error,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridItem: {
    width: "33.333%",
    paddingBottom: 6,
    marginBottom: 16,
  },
  pressed: {
    opacity: 0.65,
  },
  cover: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.divider,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    backgroundColor: Palette.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: Palette.text,
    fontSize: 24,
    fontWeight: "700",
  },
  bookTitle: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
});
