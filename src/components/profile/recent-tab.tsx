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

const STATUS_LABELS: Record<string, string> = {
  want_to_read: "Want to Read",
  reading: "Currently Reading",
  finished: "Completed",
};

export default function RecentTab() {
  const router = useRouter();

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

  function openBookDetails(openLibraryId: string) {
    // Turns "/works/OL123W" into "OL123W" for the dynamic details route.
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && books.length === 0 ? (
        <Text style={styles.emptyText}>
          Your library is empty. Add a book from Explore.
        </Text>
      ) : null}

      {books.map((libraryBook) => {
        const book = libraryBook.book;

        return (
          <Pressable
            key={libraryBook.user_book_id}
            style={({ pressed }) => [
              styles.bookCard,
              pressed && styles.pressed,
            ]}
            onPress={() => openBookDetails(book.open_library_id)}
            accessibilityRole="button"
          >
            {book.cover_url ? (
              <Image
                source={{ uri: book.cover_url }}
                style={styles.cover}
                accessibilityLabel={`Cover of ${book.title}`}
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={styles.coverText}>
                  {book.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.bookDetails}>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.author} numberOfLines={1}>
                {book.author}
              </Text>

              <Text style={styles.pageCount}>
                {book.page_count !== null
                  ? `${book.page_count} pages`
                  : "Page count unavailable"}
              </Text>

              <Text style={styles.status}>
                {STATUS_LABELS[libraryBook.status] ?? libraryBook.status}
              </Text>
            </View>
          </Pressable>
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
    backgroundColor: Palette.card,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    gap: 14,
  },
  pressed: {
    opacity: 0.65,
  },
  cover: {
    width: 64,
    height: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.divider,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    width: 64,
    height: 96,
    borderRadius: 8,
    backgroundColor: Palette.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  bookDetails: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  bookTitle: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  author: {
    color: Palette.muted,
    fontSize: 14,
  },
  pageCount: {
    color: Palette.muted,
    fontSize: 13,
  },
  status: {
    color: Palette.red,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: Palette.muted,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 16,
  },
  errorText: {
    color: Palette.error,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 16,
  },
});
