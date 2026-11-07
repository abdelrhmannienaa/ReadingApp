import type { DayStatus } from "@/lib/reading-stats";

// Colors taken from the Figma home page.
export const Palette = {
  page: "#222020",
  header: "#151515",
  card: "#2E2C2C",
  divider: "#474545",
  red: "#CF2D2D",
  ringTrack: "#442323",
  barTrack: "#443C3C",
  tile: "#494646",
  text: "#FFFFFF",
  muted: "#9F9F9F",
  error: "#FCA5A5",
} as const;

export const StatusColors: Record<DayStatus, string> = {
  unmet: "#3D3C3C",
  partial: "#711A1A",
  met: "#BA2727",
  exceeded: "#FF1A1A",
};
