import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Palette } from "@/constants/palette";

type BrandHeaderProps = {
  // The big red word at the top. Defaults to the app name.
  title?: string;
  // Anything to show under the title, like a welcome line or a search bar.
  children?: ReactNode;
};

// The dark band with the red title used at the top of every screen.
export function BrandHeader({
  title = "Reademption",
  children,
}: BrandHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
      <Text
        style={styles.title}
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Palette.header,
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  title: {
    color: Palette.red,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
  },
});
