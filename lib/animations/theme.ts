export const ARENA_COLORS = {
  teamRed: "#FF6B6B",
  teamBlue: "#4DE7F2",
  primary: "#FFC857",
  ink: "#11142B",
  midnight: "#1D2150",
  panel: "#252A5E",
  cloud: "#F5F7FF",
  fog: "#A8B0D8",
  mint: "#72F2B6",
  error: "#FF6B6B",
  overlay: "rgba(0,0,0,0.55)",
  rope: "#D4A574",
  ropeHighlight: "#F5E6C8",
} as const;

export const TYPOGRAPHY = {
  display: { fontSize: 72, fontWeight: "900" as const, letterSpacing: -2 },
  h2: { fontSize: 22, fontWeight: "900" as const },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 11, fontWeight: "800" as const, letterSpacing: 0.8 },
  button: { fontSize: 12, fontWeight: "900" as const, letterSpacing: 0.8 },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const SPRING_SNAP = { damping: 20, stiffness: 300, mass: 0.6 } as const;
export const SPRING_SOFT = { damping: 15, stiffness: 120, mass: 0.8 } as const;
export const SPRING_BOUNCE = { damping: 10, stiffness: 180, mass: 0.7 } as const;
