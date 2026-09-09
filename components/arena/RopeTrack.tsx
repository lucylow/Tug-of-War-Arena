import { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from "react-native-svg";

import {
  ArenaGround,
  Decorations,
  DummyProp,
  Flags,
  Lighting,
  LightingDefs,
  Particles,
  Scoreboard,
  Spectators,
  TorchGlow,
  useVenueClock,
} from "@/components/arena/venue";
import {
  projectParticles,
  resolveVenueFeatures,
  spawnParticles,
} from "@/lib/venue";

type RopeTrackProps = {
  pull: number;
  teamColor: string;
  opponentColor: string;
  reduceMotion?: boolean;
  compact?: boolean;
  crewScore?: number;
  opponentScore?: number;
  crewLabel?: string;
  opponentLabel?: string;
};

export function RopeTrack({
  pull,
  teamColor,
  opponentColor,
  reduceMotion = false,
  compact = false,
  crewScore,
  opponentScore,
  crewLabel = "Crew",
  opponentLabel = "Opponent",
}: RopeTrackProps) {
  const shift = Math.max(-42, Math.min(42, pull * 1.05));
  const height = compact ? 86 : 168;
  const wave = reduceMotion ? 0 : shift * 0.08;
  const gid = compact ? "Compact" : "Arena";

  const features = useMemo(
    () =>
      resolveVenueFeatures({
        compact,
        reduceMotion,
        mobile: Platform.OS === "ios" || Platform.OS === "android",
      }),
    [compact, reduceMotion],
  );

  const time = useVenueClock(features.animateFlags || features.animateParticles, features.particleFps);
  const clock = features.animateFlags || features.animateParticles ? time : 0;

  const dust = useMemo(() => {
    const spawned = spawnParticles(features.dustCount, "dust", 42);
    return projectParticles(spawned, clock);
  }, [clock, features.dustCount]);

  const fireflies = useMemo(() => {
    if (!features.showFireflies) return [];
    const spawned = spawnParticles(features.fireflyCount, "firefly", 84);
    return projectParticles(spawned, clock);
  }, [clock, features.fireflyCount, features.showFireflies]);

  return (
    <View style={[styles.stage, compact && styles.compact]}>
      <Svg width="100%" height={height} viewBox="0 0 360 168" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`arenaFloor${gid}`} x1="0" y1="0" x2="0" y2="168" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#171B45" />
            <Stop offset="1" stopColor="#0E1230" />
          </LinearGradient>
          <LinearGradient id={`ropeBody${gid}`} x1="24" y1="70" x2="336" y2="86" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={teamColor} />
            <Stop offset="0.48" stopColor="#F5F7FF" />
            <Stop offset="1" stopColor={opponentColor} />
          </LinearGradient>
          <LinearGradient id={`plazaGlow${gid}`} x1="180" y1="20" x2="180" y2="150" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFC857" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#FFC857" stopOpacity="0" />
          </LinearGradient>
          <LightingDefs gid={gid} features={features} />
        </Defs>
        <ArenaGround gid={gid} features={features} />
        <Lighting gid={gid} features={features} time={clock} />
        <Spectators features={features} />
        <Decorations features={features} teamColor={teamColor} opponentColor={opponentColor} time={clock} />
        <Flags features={features} teamColor={teamColor} opponentColor={opponentColor} time={clock} />
        <TorchGlow gid={gid} features={features} time={clock} />
        {crewScore !== undefined && opponentScore !== undefined && !compact ? (
          <Scoreboard
            crewLabel={crewLabel}
            opponentLabel={opponentLabel}
            crewScore={crewScore}
            opponentScore={opponentScore}
            teamColor={teamColor}
            opponentColor={opponentColor}
          />
        ) : (
          <>
            <Rect x="170" y="18" width="20" height="28" rx="4" fill="#FFC857" />
            <Path d="M173 28h14" stroke="#11142B" strokeWidth="2" />
          </>
        )}
        {!compact ? <DummyProp x={180} y={152} /> : null}
        <Circle cx="40" cy="108" r="16" fill={teamColor} />
        <Circle cx="72" cy="112" r="13" fill={teamColor} opacity="0.82" />
        <Circle cx="288" cy="112" r="13" fill={opponentColor} opacity="0.82" />
        <Circle cx="320" cy="108" r="16" fill={opponentColor} />
        <Path d="M32 124h20l-4 22h-12l-4-22Z" fill={teamColor} />
        <Path d="M64 126h16l-3 18H67l-3-18Z" fill={teamColor} opacity="0.82" />
        <Path d="M280 126h16l-3 18h-10l-3-18Z" fill={opponentColor} opacity="0.82" />
        <Path d="M308 124h20l-4 22h-12l-4-22Z" fill={opponentColor} />
        <Path
          d={`M${28 + shift} 78 C 90 ${62 + wave}, 150 ${90 - wave}, 180 78 S 270 ${62 + wave}, ${332 + shift} 78`}
          stroke={`url(#ropeBody${gid})`}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M${28 + shift} 78 C 90 ${66 + wave}, 150 ${86 - wave}, 180 78 S 270 ${66 + wave}, ${332 + shift} 78`}
          stroke="#11142B"
          strokeOpacity="0.25"
          strokeWidth="2"
          fill="none"
        />
        <Circle cx={36 + shift} cy="78" r="9" fill={teamColor} stroke="#F5F7FF" strokeWidth="2" />
        <Circle cx={324 + shift} cy="78" r="9" fill={opponentColor} stroke="#F5F7FF" strokeWidth="2" />
        <Ellipse cx="180" cy="78" rx="18" ry="10" fill={`url(#plazaGlow${gid})`} />
        <Particles dust={dust} fireflies={fireflies} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: "100%",
    height: 168,
    overflow: "hidden",
    borderRadius: 22,
  },
  compact: {
    height: 86,
    borderRadius: 16,
  },
});
