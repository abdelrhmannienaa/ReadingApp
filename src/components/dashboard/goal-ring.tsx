import { StyleSheet, Text, View } from "react-native";

import { Palette } from "./palette";

type GoalRingProps = {
  minutes: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
};

// Draws the progress ring with plain Views, so the app doesn't need a native SVG
// library (and a new development build) for one shape.
//
// Two half-rings do the work. Each one rotates into view from behind a clip, and
// the second half only starts moving once progress passes 50%.
export function GoalRing({
  minutes,
  goal,
  size = 96,
  strokeWidth = 15,
}: GoalRingProps) {
  const progress = goal > 0 ? Math.min(minutes / goal, 1) : 0;
  const sweep = progress * 360;
  const half = size / 2;

  const ring = {
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: strokeWidth,
  };

  // Round the ends of the arc by placing a dot at each one.
  const capRadius = half - strokeWidth / 2;
  const capStyle = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return {
      width: strokeWidth,
      height: strokeWidth,
      borderRadius: strokeWidth / 2,
      left: half + capRadius * Math.sin(radians) - strokeWidth / 2,
      top: half - capRadius * Math.cos(radians) - strokeWidth / 2,
    };
  };

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={`${minutes} of ${goal} minutes read today`}
      accessibilityValue={{ min: 0, max: goal, now: Math.min(minutes, goal) }}
    >
      <View style={[ring, { borderColor: Palette.ringTrack }]} />

      {progress > 0 && (
        <>
          {/* Right side of the ring: the first 180 degrees. */}
          <View
            style={[styles.clip, { left: half, width: half, height: size }]}
          >
            <View
              style={{
                position: "absolute",
                left: -half,
                width: size,
                height: size,
                transform: [{ rotate: `${Math.min(sweep, 180)}deg` }],
              }}
            >
              <View style={[styles.clip, { width: half, height: size }]}>
                <View style={[ring, { borderColor: Palette.red }]} />
              </View>
            </View>
          </View>

          {/* Left side of the ring: the remaining 180 degrees. */}
          <View style={[styles.clip, { width: half, height: size }]}>
            <View
              style={{
                position: "absolute",
                width: size,
                height: size,
                transform: [{ rotate: `${Math.max(sweep - 180, 0)}deg` }],
              }}
            >
              <View
                style={[styles.clip, { left: half, width: half, height: size }]}
              >
                <View
                  style={[
                    ring,
                    { marginLeft: -half, borderColor: Palette.red },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={[styles.cap, capStyle(0)]} />
          <View style={[styles.cap, capStyle(sweep)]} />
        </>
      )}

      <View style={styles.center}>
        <Text style={styles.label}>
          {minutes}/{goal}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: "absolute",
    top: 0,
    overflow: "hidden",
  },
  cap: {
    position: "absolute",
    backgroundColor: Palette.red,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
