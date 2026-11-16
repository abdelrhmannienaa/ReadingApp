import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BrandHeader } from "@/components/brand-header";
import { Palette } from "@/constants/palette";
import { supabase } from "@/lib/supabase";

type Mode = "signIn" | "signUp";

export default function AuthForm() {
  // One form handles both logging in and creating an account.
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const isSignIn = mode === "signIn";

  async function signIn() {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Enter both your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      // This always runs, whether sign-in worked or failed.
      setLoading(false);
    }
  }

  async function signUp() {
    setErrorMessage("");
    setMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Enter both your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage(error.message);
      } else if (!data.session) {
        setMessage("Please check your email to confirm your account.");
      } else {
        setMessage("Account created successfully.");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (isSignIn) {
      signIn();
    } else {
      signUp();
    }
  }

  function switchMode() {
    setMode(isSignIn ? "signUp" : "signIn");
    setErrorMessage("");
    setMessage("");
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <BrandHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.body}
      >
        <ScrollView
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isSignIn ? "Log in to your account" : "Create your account"}
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Email"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                textContentType={isSignIn ? "password" : "newPassword"}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Password"
              />
              <Pressable
                style={styles.showPassword}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={Palette.text} />
              ) : (
                <Text style={styles.submitText}>
                  {isSignIn ? "Log in" : "Create account"}
                </Text>
              )}
            </Pressable>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <Pressable
            onPress={switchMode}
            style={styles.switchLink}
            accessibilityRole="button"
          >
            <Text style={styles.switchText}>
              {isSignIn
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={styles.switchAction}>
                {isSignIn ? "Create one" : "Log in"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.page,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    padding: 20,
  },
  cardTitle: {
    color: Palette.muted,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  label: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Palette.tile,
    color: Palette.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  passwordRow: {
    justifyContent: "center",
  },
  // Leaves room on the right for the Show/Hide button.
  passwordInput: {
    paddingRight: 64,
  },
  showPassword: {
    position: "absolute",
    right: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  showPasswordText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Palette.red,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 12,
    marginTop: 22,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    color: Palette.error,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  message: {
    color: Palette.text,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  switchLink: {
    alignSelf: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  switchText: {
    color: Palette.muted,
    fontSize: 14,
  },
  switchAction: {
    color: Palette.text,
    fontWeight: "700",
  },
});
