import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_GOVERNANCE_CONTRACT, DAO_FORUM_URL, DAO_PORTAL_URL, DAO_SNAPSHOT_URL, DAO_WORKFLOW, JUDGE_FLOW } from "../scene/src/governance/constants";
import { governanceConfig } from "../scene/src/governance/config";
import { demoProposals } from "../scene/src/governance/data/demoProposals";
import { sourceNote } from "../scene/src/governance/data/overview";
import { GovernanceController } from "../scene/src/governance/controller";
import { assertNoCustodialSecrets, GOVERNANCE_SECURITY_POLICY } from "../scene/src/governance/services/contracts";
import { DaoClient, normalizeOverview, sanitizeProposals } from "../scene/src/governance/services/daoClient";
import { isOfficialDaoHost, resolveForumUrl, resolveGovernanceUrl, resolveSnapshotUrl } from "../scene/src/governance/services/destinations";
import { compactTitle, formatPercent, formatVp, normalizeMetric, normalizeVotePercent } from "../scene/src/governance/services/format";
import { checkGovernanceEndpoint } from "../scene/src/governance/services/health";
import { getGovernanceMetrics, incrementMetric, resetGovernanceMetrics } from "../scene/src/governance/services/metrics";
import { nextStage, stageIndex, stageProgress, stageShortName } from "../scene/src/governance/services/workflow";
import { createGovernanceState, selectProposal, selectedProposal } from "../scene/src/governance/state";
import {
  getGovernanceBadgesPosition,
  getGovernanceOverviewPosition,
  getGovernancePlazaPosition,
  getGovernanceTerminalPosition,
  getGovernanceVoteGuidePosition,
  getGovernanceWorkflowBoardPosition,
  getProposalPedestalPosition,
  isInsideParcel,
} from "../scene/src/logic/journey";
import { ARENA_CENTER } from "../scene/src/logic/mapping";

describe("DAO governance workflow model", () => {
  it("orders poll → draft → governance → enacted and rejects a rejected stage", () => {
    expect(stageIndex("pre-proposal")).toBe(0);
    expect(stageIndex("draft")).toBe(1);
    expect(stageIndex("governance")).toBe(2);
    expect(nextStage("pre-proposal")).toBe("draft");
    expect(nextStage("draft")).toBe("governance");
    expect(nextStage("governance")).toBe("enacted");
    expect(nextStage("enacted")).toBeNull();
    expect(stageProgress("rejected")).toBe(0);
    expect(stageProgress("governance")).toBeGreaterThan(stageProgress("draft"));
    expect(stageShortName("pre-proposal")).toBe("POLL");
    expect(DAO_WORKFLOW.preProposal.thresholdVP).toBe(500_000);
    expect(DAO_WORKFLOW.draft.thresholdVP).toBe(1_000_000);
    expect(DAO_WORKFLOW.governance.thresholdVP).toBe(6_000_000);
  });
});

describe("DAO formatters and sanitization", () => {
  it("formats VP and clamps vote percents", () => {
    expect(formatVp(5_400_000)).toBe("5.4M VP");
    expect(formatVp(812_000)).toBe("812K VP");
    expect(formatVp(40)).toBe("40 VP");
    expect(formatPercent(73.6)).toBe("74%");
    expect(normalizeVotePercent(140)).toBe(100);
    expect(normalizeVotePercent(-4)).toBe(0);
    expect(normalizeMetric(-12)).toBe(0);
    expect(compactTitle("Add Friendzone Arena as a community discovery destination", 24)).toContain("…");
  });

  it("normalizes live payloads and marks demo fallback records", () => {
    const live = normalizeOverview({
      mode: "live",
      proposals: [
        {
          ...demoProposals[0]!,
          isDemo: false,
          yesPercent: 180,
          participatingVP: -3,
        },
      ],
    });
    expect(live.mode).toBe("live");
    expect(live.proposals[0]?.yesPercent).toBe(100);
    expect(live.proposals[0]?.participatingVP).toBe(0);
    expect(live.proposals[0]?.isDemo).toBe(false);
    expect(sanitizeProposals(demoProposals, "demo").every((item) => item.isDemo)).toBe(true);
  });
});

describe("DAO client fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses deterministic demo data when no API is configured", async () => {
    const overview = await new DaoClient().getOverview();
    expect(overview.mode).toBe("demo");
    expect(overview.proposals).toHaveLength(3);
    expect(overview.proposals.every((item) => item.isDemo)).toBe(true);
    expect(overview.sourceUrl).toBe(DAO_PORTAL_URL);
  });

  it("falls back to demo content when a live endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    const overview = await new DaoClient({ apiUrl: "https://example.invalid/dao", mode: "live" }).getOverview();
    expect(overview.mode).toBe("demo");
    expect(overview.proposals.every((item) => item.isDemo)).toBe(true);
  });

  it("records a failed health check without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("timeout"))),
    );
    const health = await checkGovernanceEndpoint("https://example.invalid/dao");
    expect(health.ok).toBe(false);
    expect(health.source).toBe("live");
    expect(health.message).toContain("timeout");
  });
});

describe("DAO destinations and security boundary", () => {
  afterEach(() => {
    resetGovernanceMetrics();
  });

  it("keeps canonical DAO, forum, and Snapshot URLs", () => {
    expect(resolveGovernanceUrl()).toBe(DAO_PORTAL_URL);
    expect(resolveForumUrl()).toBe(DAO_FORUM_URL);
    expect(resolveSnapshotUrl()).toBe(DAO_SNAPSHOT_URL);
    expect(isOfficialDaoHost(DAO_PORTAL_URL)).toBe(true);
    expect(isOfficialDaoHost(DAO_FORUM_URL)).toBe(true);
    expect(isOfficialDaoHost("https://evil.example/vote")).toBe(false);
    expect(governanceConfig.officialGovernanceUrl).toBe(DAO_PORTAL_URL);
    expect(DEFAULT_GOVERNANCE_CONTRACT.neverCastBindingVoteFromScene).toBe(true);
    expect(sourceNote().toLowerCase()).toContain("binding votes");
  });

  it("forbids custodial secrets and local binding votes", () => {
    expect(GOVERNANCE_SECURITY_POLICY.privateKeysInScene).toBe(false);
    expect(GOVERNANCE_SECURITY_POLICY.secretCredentialsInScene).toBe(false);
    expect(GOVERNANCE_SECURITY_POLICY.bindingVoteImplementedLocally).toBe(false);
    expect(GOVERNANCE_SECURITY_POLICY.externalLinksMustBeExplicitClicks).toBe(true);
    expect(assertNoCustodialSecrets({ title: "proposal" })).toBe(true);
    expect(assertNoCustodialSecrets({ privateKey: "0xabc" })).toBe(false);
  });

  it("counts discovery actions without storing credentials", () => {
    incrementMetric("openedDao");
    incrementMetric("selectedProposal");
    expect(getGovernanceMetrics().openedDao).toBe(1);
    expect(getGovernanceMetrics().selectedProposal).toBe(1);
  });
});

describe("DAO world state and plaza layout", () => {
  it("selects a demo proposal and starts with a populated overview", () => {
    const state = createGovernanceState();
    expect(state.overview.proposals[0]?.id).toBe("demo-poi-friendzone");
    selectProposal(state, "demo-governance-stage");
    expect(selectedProposal(state)?.stage).toBe("governance");
    const controller = new GovernanceController(state);
    expect(controller.state.loading).toBe(false);
    expect(JUDGE_FLOW).toContain("DISCOVER_GOVERNANCE_PLAZA");
  });

  it("places the governance plaza north of the rope and inside the parcel", () => {
    const plaza = getGovernancePlazaPosition();
    const board = getGovernanceWorkflowBoardPosition();
    const terminal = getGovernanceTerminalPosition();
    const guide = getGovernanceVoteGuidePosition();
    const badges = getGovernanceBadgesPosition();
    const overview = getGovernanceOverviewPosition();
    const first = getProposalPedestalPosition(0);
    const last = getProposalPedestalPosition(2);
    expect(plaza.z).toBeGreaterThan(ARENA_CENTER.z);
    expect(board.z).toBeGreaterThan(plaza.z);
    expect(guide.x).toBeLessThan(plaza.x);
    expect(terminal.x).toBeGreaterThan(plaza.x);
    expect(first.x).toBeLessThan(last.x);
    expect(overview.y).toBeGreaterThan(2);
    for (const point of [plaza, board, terminal, guide, badges, overview, first, last]) {
      expect(isInsideParcel(point)).toBe(true);
    }
  });

  it("wires the plaza into world assembly and describes the DAO destination", () => {
    const world = readFileSync(resolve("scene/src/world.ts"), "utf8");
    const links = readFileSync(resolve("scene/src/governance/services/links.ts"), "utf8");
    const scene = JSON.parse(readFileSync(resolve("scene/scene.json"), "utf8")) as {
      display: { description: string };
    };
    expect(world).toContain("buildGovernanceExperience");
    expect(links).toContain("openExternalUrl");
    expect(scene.display.description.toLowerCase()).toContain("dao");
  });
});
