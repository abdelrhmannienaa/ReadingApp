import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { logReadingSession, type CurrentRead } from "@/api";

import { Palette } from "./palette";

const QUICK_MINUTES = [5, 15, 30, 60];
const MAX_MINUTES_PER_SESSION = 1440; // A day. Matches the database check.

type LogReadingSheetProps = {
  book: CurrentRead;
  onClose: () => void;
  onLogged: () => void;
};

// The dashboard mounts this only while it's open, so the form always starts empty.
export function LogReadingSheet({
  book,
  onClose,
  onLogged,
}: LogReadingSheetProps) {
  const [minutesText, setMinutesText] = useState("");
  const [pageText, setPageText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const minutes = Number(minutesText);
    if (
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > MAX_MINUTES_PER_SESSION
    ) {
      setError("Enter how many minutes you read.");
      return;
    }

    // Page is optional: leaving it blank logs the time and keeps your place.
    const page = pageText.trim() === "" ? book.current_page : Number(pageText);
    if (!Number.isInteger(page) || page < 0) {
      setError("Enter the page number you reached.");
      return;
    }
    if (book.page_count !== null && page > book.page_count) {
      setError(`This book only has ${book.page_count} pages.`);
      return;
    }

    setError("");
    setSaving(true);

    try {
      await logReadingSession({ book, minutes, page });
      onLogged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your reading.",
      );
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <View style={styles.sheet}>
          <Text style={styles.title}>Log Reading</Text>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Text>

          <Text style={styles.label}>Minutes read</Text>
          <TextInput
            value={minutesText}
            onChangeText={setMinutesText}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Palette.muted}
            style={styles.input}
            accessibilityLabel="Minutes read"
          />
          <View style={styles.quickRow}>
            {QUICK_MINUTES.map((value) => (
              <Pressable
                key={value}
                style={styles.quickButton}
                onPress={() => setMinutesText(String(value))}
                accessibilityRole="button"
              >
                <Text style={styles.quickText}>{value} min</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            Page reached{book.page_count ? ` (of ${book.page_count})` : ""}
          </Text>
          <TextInput
            value={pageText}
            onChangeText={setPageText}
            keyboardType="number-pad"
            placeholder={String(book.current_page)}
            placeholderTextColor={Palette.muted}
            style={styles.input}
            accessibilityLabel="Page reached"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={Palette.text} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: Palette.text,
    fontSize: 22,
    fontWeight: "700",
  },
  bookTitle: {
    color: Palette.muted,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Palette.page,
    color: Palette.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  quickButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Palette.tile,
  },
  quickText: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: Palette.error,
    fontSize: 14,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: Palette.red,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
