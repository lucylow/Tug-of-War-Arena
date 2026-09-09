import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { MobileArena } from "@/components/MobileArena";
import {
  MobileErrorRetry,
  MobileHero,
  MobileLoadingSkeleton,
  MobileModal,
  MobileNotice,
  MobileQuickActions,
  MobileSection,
  PerformanceHud,
  PullControl,
} from "@/components/mobile";
import { ARENA_COLORS } from "@/lib/animations";
import { createDiagnosticSnapshot, enqueueNotice, emptyNoticeQueue } from "@/lib/mobile-ux";
import { useReduceMotion } from "@/hooks/use-reduce-motion";

export default function MobileUxLabScreen() {
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<"lab" | "arena">("lab");
  const [modalOpen, setModalOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState(() => emptyNoticeQueue());
  const snapshot = useMemo(() => createDiagnosticSnapshot({ fps: 60, memoryMb: 42, visible: true }), []);

  if (mode === "arena") {
    return (
      <ScreenContainer className="p-0" footer={<LabTabs mode={mode} onChange={setMode} />}>
        <MobileArena onLeave={() => setMode("lab")} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll className="px-5" footer={<LabTabs mode={mode} onChange={setMode} />}>
      <Text style={styles.kicker}>FRIENDZONE BUILDATHON · MOBILE UX LAB</Text>
      <Text style={styles.title}>Touch, motion, and budgets</Text>
      <PerformanceHud snapshot={snapshot} visible />
      <MobileHero
        width={width}
        kicker="ONE-THUMB CONTROL"
        title="136pt PULL"
        body="Haptic throttling, pull rate limits, and Reanimated press live on the same Friendzone rules."
      >
        <PullControl onPull={() => setNotices((q) => enqueueNotice(q, { kind: "success", message: "Pull accepted." }))} color={ARENA_COLORS.teamRed} reduceMotion={reduceMotion} />
      </MobileHero>
      <MobileSection width={width} title="QUICK ACTIONS">
        <MobileQuickActions
          actions={[
            { key: "toast", label: "TOAST", onPress: () => setNotices((q) => enqueueNotice(q, { kind: "info", message: "Crew is watching." })) },
            { key: "modal", label: "MODAL", onPress: () => setModalOpen(true) },
            { key: "fail", label: "ERROR", onPress: () => setFailed(true) },
            { key: "load", label: "SKELETON", onPress: () => setLoading((value) => !value) },
          ]}
        />
      </MobileSection>
      {notices.items.map((notice) => (
        <MobileNotice key={notice.id} notice={notice} />
      ))}
      {loading ? <MobileLoadingSkeleton reduceMotion={reduceMotion} /> : null}
      {failed ? <MobileErrorRetry onRetry={() => setFailed(false)} /> : null}
      <MobileModal open={modalOpen} title="Room details" onClose={() => setModalOpen(false)}>
        <Text style={styles.body}>Focus stays on the sheet. Background chrome is inert while this is open.</Text>
      </MobileModal>
    </ScreenContainer>
  );
}

function LabTabs({ mode, onChange }: { mode: "lab" | "arena"; onChange: (mode: "lab" | "arena") => void }) {
  return (
    <View style={styles.tabs}>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === "lab" }} onPress={() => onChange("lab")} style={[styles.tab, mode === "lab" && styles.tabOn]}>
        <Text style={styles.tabText}>Lab</Text>
      </Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === "arena" }} onPress={() => onChange("arena")} style={[styles.tab, mode === "arena" && styles.tabOn]}>
        <Text style={styles.tabText}>Arena</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: ARENA_COLORS.fog, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginTop: 8 },
  title: { color: ARENA_COLORS.cloud, fontSize: 26, fontWeight: "900", marginBottom: 12 },
  body: { color: ARENA_COLORS.fog, fontSize: 14, lineHeight: 20 },
  tabs: { flexDirection: "row", gap: 8, padding: 12 },
  tab: { flex: 1, minHeight: 44, borderRadius: 14, backgroundColor: ARENA_COLORS.panel, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: ARENA_COLORS.midnight, borderWidth: 1, borderColor: ARENA_COLORS.primary },
  tabText: { color: ARENA_COLORS.cloud, fontWeight: "800" },
});
