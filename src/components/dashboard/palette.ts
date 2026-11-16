import type { DayStatus } from "@/lib/reading-stats";

// The shared colors now live in constants/palette.ts so every screen can use
// them. They're re-exported here so the dashboard imports keep working.
export { Palette } from "@/constants/palette";

export const StatusColors: Record<DayStatus, string> = {
  unmet: "#3D3C3C",
  partial: "#711A1A",
  met: "#BA2727",
  exceeded: "#FF1A1A",
};
