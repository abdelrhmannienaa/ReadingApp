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

import { setDailyGoal } from "@/api";

import { Palette } from "./palette";

const PRESETS = [15, 30, 45, 60];

type GoalSheetProps = {
  currentGoal: number | null;
  onClose: () => void;
  onSaved: () => void;
};

export function GoalSheet({ currentGoal, onClose, onSaved }: GoalSheetProps) {
  const [goalText, setGoalText] = useState(
    currentGoal === null ? "" : String(currentGoal),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const minutes = Number(goalText);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setError("Enter a goal between 1 and 1440 minutes.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await setDailyGoal(minutes);
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your goal.",
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
          <Text style={styles.title}>Daily Reading Goal</Text>
          <Text style={styles.subtitle}>
            {currentGoal === null
              ? "How many minutes do you want to read each day?"
              : "Changes start today and don't affect past days."}
          </Text>

          <TextInput
            value={goalText}
            onChangeText={setGoalText}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={Palette.muted}
            style={styles.input}
            accessibilityLabel="Daily goal in minutes"
          />

          <View style={styles.presetRow}>
            {PRESETS.map((value) => (
              <Pressable
                key={value}
                style={styles.preset}
                onPress={() => setGoalText(String(value))}
                accessibilityRole="button"
              >
                <Text style={styles.presetText}>{value} min</Text>
              </Pressable>
            ))}
          </View>

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
              <Text style={styles.saveText}>Save Goal</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
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
  title: { color: Palette.text, fontSize: 22, fontWeight: "700" },
  subtitle: {
    color: Palette.muted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Palette.page,
    color: Palette.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  presetRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  preset: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Palette.tile,
  },
  presetText: { color: Palette.text, fontSize: 13, fontWeight: "600" },
  error: { color: Palette.error, fontSize: 14, marginTop: 12 },
  saveButton: {
    backgroundColor: Palette.red,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: Palette.text, fontSize: 16, fontWeight: "700" },
});
