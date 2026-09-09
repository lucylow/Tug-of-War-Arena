# Decentraland DAO Governance — 25+ Pages of Detailed Code

## Purpose

This implementation adds an **in-world governance discovery and participation layer** to the existing Tug of War Arena Friendzone Decentraland SDK7 World. It is deliberately built as a 3D experience: governance is represented by physical plazas, proposal pedestals, workflow boards, terminals, labels, and interactive objects. Binding voting is not faked inside the scene; players are routed to the official governance interface for actual participation.

> Important: the current Decentraland DAO uses its governance dApp, Snapshot, and associated governance infrastructure. The World should present governance information and discovery, not claim to be the authoritative DAO interface. Verify live policies/thresholds before publication.

---

# PAGE 1 — GOVERNANCE PRODUCT CONTRACT

The World should not pretend to replace Decentraland's official governance dApp. Instead, the 3D scene becomes an in-world discovery and education layer. Players can inspect proposal stages, see proposal metadata, learn the workflow, and click into the official governance site or forum for binding participation. This mirrors Decentraland's documented architecture: proposals and votes are handled through the governance dApp and Snapshot, while binding actions are enacted through the DAO's on-chain governance infrastructure.

```ts
export type GovernanceMode = 'demo' | 'live';

export interface GovernanceFeatureContract {
  mode: GovernanceMode;
  allowExternalDaoLinks: boolean;
  showDemoLabels: boolean;
  neverCastBindingVoteFromScene: boolean;
}

export const DEFAULT_GOVERNANCE_CONTRACT: GovernanceFeatureContract = {
  mode: 'demo',
  allowExternalDaoLinks: true,
  showDemoLabels: true,
  neverCastBindingVoteFromScene: true
};
```

---

# PAGE 2 — DOMAIN TYPES

The governance domain is intentionally independent from rendering. Proposal cards, workflow stages, source URLs, and world state are plain TypeScript structures. This keeps the 3D scene replaceable without changing governance logic.

```ts
export type DaoStage = 'pre-proposal' | 'draft' | 'governance' | 'enacted' | 'rejected';

export type DaoProposalCategory =
  | 'governance'
  | 'grant'
  | 'poi'
  | 'catalyst'
  | 'name-ban'
  | 'community-poll';

export type DaoVoteChoice = 'yes' | 'no' | 'abstain';

export interface DaoProposal {
  id: string;
  title: string;
  category: DaoProposalCategory;
  stage: DaoStage;
  summary: string;
  author: string;
  createdAt: string;
  endAt?: string;
  yesPercent: number;
  noPercent: number;
  abstainPercent: number;
  participatingVP: number;
  acceptanceThresholdVP: number;
  discussionUrl?: string;
  governanceUrl?: string;
  snapshotUrl?: string;
  isDemo: boolean;
}

export interface DaoOverview {
  votingPowerEligibility: string;
  votingPowerNote: string;
  workflow: Array<{
    stage: DaoStage;
    label: string;
    goal: string;
    thresholdVP: number;
    duration: string;
  }>;
  proposals: DaoProposal[];
  sourceUrl: string;
  fetchedAt: string;
  mode: 'demo' | 'live';
}

export interface GovernanceWorldState {
  selectedProposalId: string | null;
  overview: DaoOverview;
  lastRefreshAt: number;
  loading: boolean;
  error: string | null;
}

export interface DaoInteraction {
  kind: 'open-governance' | 'open-forum' | 'open-snapshot' | 'refresh' | 'select-proposal';
  proposalId?: string;
  at: number;
}
```

---

# PAGE 3 — GOVERNANCE CONSTANTS

Centralize official URL targets and informational workflow thresholds. These values should be verified against the official governance site before a production release because DAO policy can change.

```ts
export const DAO_PORTAL_URL = 'https://governance.decentraland.org/';
export const DAO_FORUM_URL = 'https://forum.decentraland.org/';

// These are informational defaults for the current Decentraland DAO governance flow.
// Verify live thresholds on governance.decentraland.org before presenting them as current policy.
export const DAO_WORKFLOW = {
  preProposal: {
    label: 'PRE-PROPOSAL POLL',
    thresholdVP: 500_000,
    duration: '5 days',
    goal: 'Gauge community sentiment and build support for an issue.'
  },
  draft: {
    label: 'DRAFT PROPOSAL',
    thresholdVP: 1_000_000,
    duration: '1 week',
    goal: 'Formalize the policy, impact, and implementation path.'
  },
  governance: {
    label: 'GOVERNANCE PROPOSAL',
    thresholdVP: 6_000_000,
    duration: '2 weeks',
    goal: 'Request a binding governance outcome.'
  }
} as const;

export const DAO_VOTING_POWER_TEXT =
  'Decentraland DAO participation is associated with MANA, LAND, or NAME ownership and proposal-specific Voting Power.';

export const DAO_SOURCE_NOTE =
  'This World surface is an educational/discovery layer. Binding votes remain in the official Decentraland governance interface.';
```

---

# PAGE 4 — DEMO PROPOSAL DATA

The demo world needs deterministic content so a judge can explore the same proposal landscape every time. Every synthetic record is explicitly marked as demo data.

```ts
import { DaoProposal } from '../types';

export const demoProposals: DaoProposal[] = [
  {
    id: 'demo-poi-friendzone',
    title: 'Add Friendzone Arena as a community discovery destination',
    category: 'poi',
    stage: 'pre-proposal',
    summary: 'Demonstration proposal showing how a community destination could be discussed and advanced through the DAO process.',
    author: 'friendzone-demo',
    createdAt: '2026-09-01T12:00:00Z',
    endAt: '2026-09-06T12:00:00Z',
    yesPercent: 74,
    noPercent: 18,
    abstainPercent: 8,
    participatingVP: 412_000,
    acceptanceThresholdVP: 500_000,
    discussionUrl: 'https://forum.decentraland.org/',
    governanceUrl: 'https://governance.decentraland.org/',
    snapshotUrl: 'https://snapshot.org/',
    isDemo: true
  },
  {
    id: 'demo-community-event',
    title: 'Fund a community social-game event series',
    category: 'grant',
    stage: 'draft',
    summary: 'Demonstration grant proposal for a recurring social competition and creator event series.',
    author: 'community-demo',
    createdAt: '2026-08-28T12:00:00Z',
    endAt: '2026-09-05T12:00:00Z',
    yesPercent: 63,
    noPercent: 29,
    abstainPercent: 8,
    participatingVP: 812_000,
    acceptanceThresholdVP: 1_000_000,
    discussionUrl: 'https://forum.decentraland.org/',
    governanceUrl: 'https://governance.decentraland.org/',
    snapshotUrl: 'https://snapshot.org/',
    isDemo: true
  },
  {
    id: 'demo-governance-stage',
    title: 'Improve discovery surfaces for social experiences',
    category: 'governance',
    stage: 'governance',
    summary: 'Demonstration governance proposal explaining the transition from community signaling to a binding outcome.',
    author: 'governance-demo',
    createdAt: '2026-08-20T12:00:00Z',
    endAt: '2026-09-03T12:00:00Z',
    yesPercent: 68,
    noPercent: 24,
    abstainPercent: 8,
    participatingVP: 5_400_000,
    acceptanceThresholdVP: 6_000_000,
    discussionUrl: 'https://forum.decentraland.org/',
    governanceUrl: 'https://governance.decentraland.org/',
    snapshotUrl: 'https://snapshot.org/',
    isDemo: true
  }
];
```

---

# PAGE 5 — OVERVIEW FACTORY

Create an overview object containing eligibility messaging, workflow stages, proposals, and source metadata. This is the single object consumed by the World presentation layer.

```ts
import { DAO_PORTAL_URL, DAO_VOTING_POWER_TEXT, DAO_WORKFLOW, DAO_SOURCE_NOTE } from '../constants';
import { DaoOverview } from '../types';
import { demoProposals } from './demoProposals';

export function createDemoDaoOverview(): DaoOverview {
  return {
    votingPowerEligibility: 'MANA / LAND / NAME holders',
    votingPowerNote: DAO_VOTING_POWER_TEXT,
    workflow: [
      {
        stage: 'pre-proposal',
        label: DAO_WORKFLOW.preProposal.label,
        goal: DAO_WORKFLOW.preProposal.goal,
        thresholdVP: DAO_WORKFLOW.preProposal.thresholdVP,
        duration: DAO_WORKFLOW.preProposal.duration
      },
      {
        stage: 'draft',
        label: DAO_WORKFLOW.draft.label,
        goal: DAO_WORKFLOW.draft.goal,
        thresholdVP: DAO_WORKFLOW.draft.thresholdVP,
        duration: DAO_WORKFLOW.draft.duration
      },
      {
        stage: 'governance',
        label: DAO_WORKFLOW.governance.label,
        goal: DAO_WORKFLOW.governance.goal,
        thresholdVP: DAO_WORKFLOW.governance.thresholdVP,
        duration: DAO_WORKFLOW.governance.duration
      }
    ],
    proposals: demoProposals,
    sourceUrl: DAO_PORTAL_URL,
    fetchedAt: new Date().toISOString(),
    mode: 'demo'
  };
}

export function sourceNote(): string {
  return DAO_SOURCE_NOTE;
}
```

---

# PAGE 6 — GOVERNANCE CLIENT

A configurable client allows the scene to use demo data now and a real JSON API later. The client normalizes external responses and falls back to demo content when an endpoint is unavailable.

```ts
import { DaoOverview, DaoProposal } from '../types';
import { createDemoDaoOverview } from '../data/overview';

export interface DaoClientConfig {
  apiUrl?: string;
  mode?: 'demo' | 'live';
}

export class DaoClient {
  private readonly apiUrl: string | undefined;
  private readonly mode: 'demo' | 'live';

  constructor(config: DaoClientConfig = {}) {
    this.apiUrl = config.apiUrl;
    this.mode = config.mode ?? (config.apiUrl ? 'live' : 'demo');
  }

  async getOverview(): Promise<DaoOverview> {
    if (this.mode === 'demo' || !this.apiUrl) {
      return createDemoDaoOverview();
    }

    try {
      const response = await fetch(this.apiUrl, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`DAO API returned ${response.status}`);
      const payload = (await response.json()) as Partial<DaoOverview>;
      return normalizeOverview(payload);
    } catch (error) {
      // A World should still render when an external endpoint is unavailable.
      console.warn('[Friendzone DAO] live fetch failed, using demo fallback', error);
      return createDemoDaoOverview();
    }
  }
}

function normalizeOverview(payload: Partial<DaoOverview>): DaoOverview {
  const fallback = createDemoDaoOverview();
  return {
    votingPowerEligibility: payload.votingPowerEligibility ?? fallback.votingPowerEligibility,
    votingPowerNote: payload.votingPowerNote ?? fallback.votingPowerNote,
    workflow: payload.workflow?.length ? payload.workflow : fallback.workflow,
    proposals: sanitizeProposals(payload.proposals?.length ? payload.proposals : fallback.proposals),
    sourceUrl: payload.sourceUrl ?? fallback.sourceUrl,
    fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
    mode: payload.mode === 'live' ? 'live' : 'demo'
  };
}

function sanitizeProposals(items: DaoProposal[]): DaoProposal[] {
  return items.map((item) => ({
    ...item,
    yesPercent: clampPercent(item.yesPercent),
    noPercent: clampPercent(item.noPercent),
    abstainPercent: clampPercent(item.abstainPercent),
    participatingVP: Math.max(0, Number(item.participatingVP) || 0),
    acceptanceThresholdVP: Math.max(0, Number(item.acceptanceThresholdVP) || 0)
  }));
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Number(value) || 0));
}
```

---

# PAGE 7 — GOVERNANCE CONFIGURATION

Keep live/demo configuration in one place so deployment environments can switch without editing visual components.

```ts
export interface GovernanceConfig {
  mode: 'demo' | 'live';
  apiUrl?: string;
  officialGovernanceUrl: string;
  officialForumUrl: string;
}

export const governanceConfig: GovernanceConfig = {
  mode: 'demo',
  officialGovernanceUrl: 'https://governance.decentraland.org/',
  officialForumUrl: 'https://forum.decentraland.org/'
};
```

---

# PAGE 8 — GOVERNANCE STATE

World state only tracks selection, loading, refresh timestamp, and error state. It does not hold private keys, voting secrets, or custodial assets.

```ts
import { createDemoDaoOverview } from './data/overview';
import { GovernanceWorldState } from './types';

export function createGovernanceState(): GovernanceWorldState {
  return {
    selectedProposalId: null,
    overview: createDemoDaoOverview(),
    lastRefreshAt: Date.now(),
    loading: false,
    error: null
  };
}

export function selectProposal(state: GovernanceWorldState, proposalId: string): void {
  state.selectedProposalId = proposalId;
}
```

---

# PAGE 9 — CONTROLLER

The controller coordinates asynchronous refreshes while keeping React-style state concerns outside the 3D presentation code.

```ts
import { DaoClient } from './services/daoClient';
import { GovernanceWorldState } from './state';

export class GovernanceController {
  private readonly client: DaoClient;
  public readonly state: GovernanceWorldState;

  constructor(state: GovernanceWorldState, client = new DaoClient()) {
    this.state = state;
    this.client = client;
  }

  refresh(): void {
    this.state.loading = true;
    this.state.error = null;

    void this.client.getOverview().then((overview) => {
      this.state.overview = overview;
      this.state.lastRefreshAt = Date.now();
      this.state.loading = false;
    }).catch((error) => {
      this.state.loading = false;
      this.state.error = error instanceof Error ? error.message : 'Unable to refresh DAO data';
    });
  }
}
```

---

# PAGE 10 — WORKFLOW MODEL

Governance has a recognizable progression. Keep this logic centralized so the world can visualize the same stages consistently.

```ts
import { DaoStage } from '../types';

const ORDER: DaoStage[] = ['pre-proposal', 'draft', 'governance', 'enacted'];

export function stageIndex(stage: DaoStage): number {
  return Math.max(0, ORDER.indexOf(stage));
}

export function stageProgress(stage: DaoStage): number {
  const index = stageIndex(stage);
  if (stage === 'rejected') return 0;
  return Math.min(1, (index + 1) / ORDER.length);
}

export function nextStage(stage: DaoStage): DaoStage | null {
  const index = ORDER.indexOf(stage);
  if (index < 0 || index + 1 >= ORDER.length) return null;
  return ORDER[index + 1];
}

export function stageShortName(stage: DaoStage): string {
  switch (stage) {
    case 'pre-proposal': return 'POLL';
    case 'draft': return 'DRAFT';
    case 'governance': return 'GOV';
    case 'enacted': return 'ENACTED';
    case 'rejected': return 'REJECTED';
  }
}
```

---

# PAGE 11 — FORMATTERS

Compact formatting keeps the world readable. Governance boards have much less screen real estate than a web governance dashboard.

```ts
export function formatVp(vp: number): string {
  if (!Number.isFinite(vp)) return '0 VP';
  if (vp >= 1_000_000) return `${(vp / 1_000_000).toFixed(1)}M VP`;
  if (vp >= 1_000) return `${Math.round(vp / 1_000)}K VP`;
  return `${Math.round(vp)} VP`;
}

export function formatPercent(value: number): string {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return `${Math.round(safe)}%`;
}

export function compactTitle(title: string, max = 36): string {
  if (title.length <= max) return title;
  return `${title.slice(0, Math.max(1, max - 1))}…`;
}
```

---

# PAGE 12 — HEALTH CHECK

A live endpoint should never make the entire World fail to render. Health checks expose source availability while the demo fallback preserves navigation.

```ts
export interface GovernanceHealth {
  ok: boolean;
  latencyMs: number | null;
  source: 'demo' | 'live';
  message: string;
}

export async function checkGovernanceEndpoint(url: string): Promise<GovernanceHealth> {
  const started = Date.now();
  try {
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    return {
      ok: response.ok,
      latencyMs: Date.now() - started,
      source: 'live',
      message: response.ok ? 'Governance source reachable' : `Governance source returned ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      source: 'live',
      message: error instanceof Error ? error.message : 'Governance source unavailable'
    };
  }
}
```

---

# PAGE 13 — SAFE EXTERNAL LINKS

Decentraland allows external websites to be opened from explicit player interactions. The governance buttons use that boundary rather than embedding an unsafe hidden navigation action.

```ts
import { openExternalUrl } from '~system/RestrictedActions';
import { DAO_FORUM_URL, DAO_PORTAL_URL } from '../constants';
import { DaoProposal } from '../types';
import { incrementMetric } from './metrics';

async function open(url: string): Promise<void> {
  try {
    await openExternalUrl({ url });
  } catch (error) {
    console.warn('[Friendzone DAO] external link failed', error);
  }
}

export function openDao(): void {
  incrementMetric('openedDao');
  void open(DAO_PORTAL_URL);
}

export function openForum(): void {
  incrementMetric('openedForum');
  void open(DAO_FORUM_URL);
}

export function openProposal(proposal: DaoProposal): void {
  incrementMetric('openedProposal');
  void open(proposal.governanceUrl ?? DAO_PORTAL_URL);
}

export function openDiscussion(proposal: DaoProposal): void {
  incrementMetric('openedForum');
  void open(proposal.discussionUrl ?? DAO_FORUM_URL);
}

export function openSnapshot(proposal: DaoProposal): void {
  incrementMetric('openedSnapshot');
  void open(proposal.snapshotUrl ?? 'https://snapshot.org/');
}
```

---

# PAGE 14 — GOVERNANCE METRICS

Local metrics let the scene understand which governance discovery actions players take without requiring a third-party analytics provider.

```ts
export interface GovernanceMetrics {
  openedDao: number;
  openedForum: number;
  openedProposal: number;
  openedSnapshot: number;
  selectedProposal: number;
}

const metrics: GovernanceMetrics = {
  openedDao: 0,
  openedForum: 0,
  openedProposal: 0,
  openedSnapshot: 0,
  selectedProposal: 0
};

export function incrementMetric(key: keyof GovernanceMetrics): void {
  metrics[key] += 1;
}

export function getGovernanceMetrics(): GovernanceMetrics {
  return { ...metrics };
}
```

---

# PAGE 15 — PAVILION FOUNDATION

The Governance Pavilion is a true 3D spatial feature: physical platform, columns, labels, pedestals, interactive proposal surfaces, and external-link terminals.

```ts
import {
  engine,
  MeshCollider,
  MeshRenderer,
  pointerEventsSystem,
  Transform,
  InputAction,
  Billboard,
  TextShape
} from '@dcl/sdk/ecs';
import { PointerEventType } from '@dcl/sdk/ecs';
import { Vector3, Quaternion } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { DaoProposal, DaoStage } from '../types';
import { openDao, openDiscussion, openProposal, openSnapshot } from '../services/links';
import { paint } from '../visual/materialFactory';

export interface GovernancePavilionRefs {
  selected: number | null;
  proposalEntities: Map<string, number>;
}

function addBox(position: Vector3, scale: Vector3, color: any): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position, scale });
  MeshRenderer.setBox(entity);
  MeshCollider.setBox(entity);
  paint(entity, color);
  return entity;
}

function label(text: string, position: Vector3, size: number, color: any, billboard = true): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position });
  if (billboard) Billboard.create(entity);
  TextShape.create(entity, { text, fontSize: size, textColor: color });
  return entity;
}

export function buildGovernancePavilion(proposals: DaoProposal[], anchorZ = 12.4): GovernancePavilionRefs {
  const refs: GovernancePavilionRefs = { selected: null, proposalEntities: new Map() };

  const base = addBox(Vector3.create(8, 0.25, anchorZ), Vector3.create(13, 0.5, 3.0), COLORS.panel);
  void base;
  label('FRIENDZONE • DAO GOVERNANCE PLAZA', Vector3.create(8, 2.95, anchorZ), 0.9, COLORS.white);
  label('EXPLORE PROPOSALS • DISCUSS • VOTE IN THE OFFICIAL DAO', Vector3.create(8, 2.35, anchorZ), 0.45, COLORS.white);

  createPavilionColumns(anchorZ);
  createWorkflowTimeline(anchorZ);
  createDaoPortal(Vector3.create(1.2, 1.15, anchorZ), 'OPEN DAO', openDao, COLORS.pink);
  createDaoPortal(Vector3.create(14.8, 1.15, anchorZ), 'DAO FORUM', openDao, COLORS.purple);

  proposals.forEach((proposal, index) => {
    const x = 3 + index * 5;
    const entity = createProposalPedestal(proposal, Vector3.create(x, 0.75, anchorZ), refs);
    refs.proposalEntities.set(proposal.id, entity);
  });

  return refs;
}

function createPavilionColumns(anchorZ: number): void {
  for (const x of [1.0, 15.0]) {
    addBox(Vector3.create(x, 2.0, anchorZ), Vector3.create(0.35, 4.0, 0.35), x < 8 ? COLORS.pink : COLORS.purple);
  }
}

function createWorkflowTimeline(anchorZ: number): void {
  const stages: Array<{ label: string; stage: DaoStage; color: any }> = [
    { label: '1 • POLL', stage: 'pre-proposal', color: COLORS.pink },
    { label: '2 • DRAFT', stage: 'draft', color: COLORS.purple },
    { label: '3 • GOVERNANCE', stage: 'governance', color: COLORS.sun }
  ];
  stages.forEach((item, index) => {
    const x = 3.4 + index * 4.6;
    const orb = addBox(Vector3.create(x, 0.62, anchorZ - 1.25), Vector3.create(2.6, 0.16, 0.35), item.color);
    void orb;
    label(item.label, Vector3.create(x, 1.0, anchorZ - 1.25), 0.38, COLORS.white);
  });
}

function createDaoPortal(position: Vector3, text: string, action: () => void, color: any): number {
  const entity = addBox(position, Vector3.create(1.8, 0.25, 1.0), color);
  label(text, Vector3.create(position.x, position.y + 0.45, position.z), 0.42, COLORS.white);
  pointerEventsSystem.onPointerDown({
    entity,
    opts: {
      button: InputAction.IA_PRIMARY,
      hoverText: text,
      maxDistance: 10
    }
  }, action);
  return entity;
}

function createProposalPedestal(proposal: DaoProposal, position: Vector3, refs: GovernancePavilionRefs): number {
  const color = proposal.stage === 'governance' ? COLORS.sun : proposal.stage === 'draft' ? COLORS.purple : COLORS.pink;
  const pedestal = addBox(position, Vector3.create(3.6, 1.3, 1.8), COLORS.panel);
  addBox(Vector3.create(position.x, position.y + 0.78, position.z), Vector3.create(3.0, 0.1, 1.4), color);

  label(stageLabel(proposal.stage), Vector3.create(position.x, position.y + 1.35, position.z - 0.45), 0.34, color);
  label(proposal.title.slice(0, 30), Vector3.create(position.x, position.y + 0.75, position.z), 0.38, COLORS.white);
  label(`${proposal.yesPercent}% YES • ${formatVP(proposal.participatingVP)} VP`, Vector3.create(position.x, position.y + 0.25, position.z), 0.30, COLORS.white);
  label(proposal.isDemo ? 'DEMO PROPOSAL • CLICK TO EXPLORE' : 'LIVE PROPOSAL • CLICK TO EXPLORE', Vector3.create(position.x, position.y - 0.25, position.z), 0.22, COLORS.white);

  pointerEventsSystem.onPointerDown({
    entity: pedestal,
    opts: { button: InputAction.IA_PRIMARY, hoverText: 'Explore proposal', maxDistance: 9 }
  }, () => {
    refs.selected = pedestal;
    openProposal(proposal);
  });

  createProposalAction(Vector3.create(position.x - 1.25, position.y + 0.16, position.z - 0.95), 'DISCUSS', () => openDiscussion(proposal), COLORS.pink);
  createProposalAction(Vector3.create(position.x, position.y + 0.16, position.z - 0.95), 'SNAPSHOT', () => openSnapshot(proposal), COLORS.purple);
  createProposalAction(Vector3.create(position.x + 1.25, position.y + 0.16, position.z - 0.95), 'DAO', () => openProposal(proposal), COLORS.sun);

  return pedestal;
}

function createProposalAction(position: Vector3, text: string, action: () => void, color: any): number {
  const entity = addBox(position, Vector3.create(0.85, 0.08, 0.28), color);
  label(text, Vector3.create(position.x, position.y + 0.18, position.z), 0.18, COLORS.white);
  pointerEventsSystem.onPointerDown({
    entity,
    opts: { button: InputAction.IA_PRIMARY, hoverText: text, maxDistance: 8 }
  }, action);
  return entity;
}

function stageLabel(stage: DaoStage): string {
  return stage === 'pre-proposal'
    ? 'PRE-PROPOSAL POLL'
    : stage === 'draft'
      ? 'DRAFT PROPOSAL'
      : stage === 'governance'
        ? 'GOVERNANCE PROPOSAL'
        : stage.toUpperCase();
}

function formatVP(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}
```

---

# PAGE 16 — WORKFLOW BOARD

The workflow board is a world-space 3D information surface, not a flat HTML-only page.

```ts
import { engine, MeshCollider, MeshRenderer, pointerEventsSystem, Transform, InputAction, TextShape, Billboard } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { DaoOverview } from '../types';
import { formatVp } from '../services/format';
import { openDao } from '../services/links';
import { paint } from '../visual/materialFactory';

export function createWorkflowBoard(overview: DaoOverview, position: Vector3): void {
  const board = engine.addEntity();
  Transform.create(board, { position, scale: Vector3.create(4.6, 2.4, 0.18) });
  MeshRenderer.setBox(board);
  MeshCollider.setBox(board);
  paint(board, COLORS.panel);

  addLabel('DAO GOVERNANCE PATH', Vector3.create(position.x, position.y + 0.8, position.z - 0.16), 0.58, COLORS.pink);

  overview.workflow.forEach((step, index) => {
    const y = position.y + 0.25 - index * 0.45;
    addLabel(
      `${index + 1}. ${step.label} • ${formatVp(step.thresholdVP)} • ${step.duration}`,
      Vector3.create(position.x, y, position.z - 0.16),
      0.29,
      index === 2 ? COLORS.sun : COLORS.white
    );
  });

  pointerEventsSystem.onPointerDown({
    entity: board,
    opts: { button: InputAction.IA_PRIMARY, hoverText: 'Open official governance', maxDistance: 10 }
  }, openDao);
}

function addLabel(text: string, position: Vector3, size: number, color: any): void {
  const entity = engine.addEntity();
  Transform.create(entity, { position });
  Billboard.create(entity);
  TextShape.create(entity, { text, fontSize: size, textColor: color });
}
```

---

# PAGE 17 — PROPOSAL STATUS

Proposal status is represented as world-space text near each proposal node so a player can understand the stage before clicking through.

```ts
import { engine, TextShape, Transform, Billboard } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { DaoProposal } from '../types';
import { formatPercent, formatVp } from '../services/format';
import { stageShortName } from '../services/workflow';

export function createProposalStatus(proposal: DaoProposal, position: Vector3): void {
  const lines = [
    `${stageShortName(proposal.stage)} • ${proposal.category.toUpperCase()}`,
    proposal.title,
    `YES ${formatPercent(proposal.yesPercent)}  •  NO ${formatPercent(proposal.noPercent)}`,
    `${formatVp(proposal.participatingVP)} PARTICIPATING`,
    proposal.isDemo ? 'DEMO DATA • VERIFY IN OFFICIAL DAO' : 'LIVE DATA'
  ];

  lines.forEach((line, index) => {
    const entity = engine.addEntity();
    Transform.create(entity, { position: Vector3.create(position.x, position.y - index * 0.36, position.z) });
    Billboard.create(entity);
    TextShape.create(entity, {
      text: line,
      fontSize: index === 1 ? 0.34 : 0.27,
      textColor: index === 0 ? COLORS.pink : index === 4 ? COLORS.sun : COLORS.white
    });
  });
}
```

---

# PAGE 18 — VOTING GUIDE

The voting guide explains the boundary between the World and the official DAO. This is important for user trust and prevents the scene from implying that a local button directly casts a binding vote.

```ts
import { engine, MeshCollider, MeshRenderer, pointerEventsSystem, Transform, InputAction, TextShape, Billboard } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { openDao } from '../services/links';

export function createVoteGuide(position: Vector3): void {
  const panel = engine.addEntity();
  Transform.create(panel, { position, scale: Vector3.create(3.8, 2.8, 0.2) });
  MeshRenderer.setBox(panel);
  MeshCollider.setBox(panel);

  addText('HOW TO PARTICIPATE', Vector3.create(position.x, position.y + 0.9, position.z - 0.15), 0.55, COLORS.pink);
  addText('1  CONNECT A WALLET', Vector3.create(position.x, position.y + 0.35, position.z - 0.15), 0.30, COLORS.white);
  addText('2  REVIEW PROPOSAL', Vector3.create(position.x, position.y - 0.05, position.z - 0.15), 0.30, COLORS.white);
  addText('3  VOTE IN OFFICIAL DAO', Vector3.create(position.x, position.y - 0.45, position.z - 0.15), 0.30, COLORS.white);
  addText('THIS WORLD DOES NOT CAST BINDING VOTES', Vector3.create(position.x, position.y - 0.88, position.z - 0.15), 0.21, COLORS.sun);

  pointerEventsSystem.onPointerDown({
    entity: panel,
    opts: {
      button: InputAction.IA_PRIMARY,
      hoverText: 'Open official DAO',
      maxDistance: 10
    }
  }, openDao);
}

function addText(text: string, position: Vector3, fontSize: number, color: any): void {
  const entity = engine.addEntity();
  Transform.create(entity, { position });
  Billboard.create(entity);
  TextShape.create(entity, { text, fontSize, textColor: color });
}
```

---

# PAGE 19 — TERMINAL BUTTONS

The terminal creates physically clickable governance surfaces inside the World. Both DAO and Forum destinations are explicit player actions.

```ts
import { engine, MeshCollider, MeshRenderer, pointerEventsSystem, Transform, InputAction } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { openDao, openForum } from '../services/links';
import { paint } from '../visual/materialFactory';

export interface GovernanceTerminalRefs {
  dao: number;
  forum: number;
}

export function createGovernanceTerminal(position: Vector3): GovernanceTerminalRefs {
  const dao = createTerminalButton(Vector3.create(position.x - 1.1, position.y, position.z), COLORS.pink, 'Open official DAO', openDao);
  const forum = createTerminalButton(Vector3.create(position.x + 1.1, position.y, position.z), COLORS.purple, 'Open DAO forum', openForum);
  return { dao, forum };
}

function createTerminalButton(position: Vector3, color: any, hoverText: string, action: () => void): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position, scale: Vector3.create(1.7, 0.18, 0.7) });
  MeshRenderer.setBox(entity);
  MeshCollider.setBox(entity);
  paint(entity, color);
  pointerEventsSystem.onPointerDown({ entity, opts: { button: InputAction.IA_PRIMARY, hoverText, maxDistance: 8 } }, action);
  return entity;
}
```

---

# PAGE 20 — VISUAL MATERIALS

Governance surfaces share a material helper so the pavilion feels visually consistent with the rest of the Friendzone scene.

```ts
import { Material } from '@dcl/sdk/ecs';

export function paint(entity: number, color: { r: number; g: number; b: number; a: number }): void {
  Material.setPbrMaterial(entity, {
    albedoColor: color,
    metallic: 0.15,
    roughness: 0.45
  });
}
```

---

# PAGE 21 — WORLD ACCENTS

Small floating accents give the governance plaza life without turning it into a high-cost particle simulation.

```ts
import { engine, Transform, MeshRenderer } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { addAmbientMotion } from '../../systems/ambient';
import { paint } from '../visual/materialFactory';

export function createGovernanceAccents(): void {
  for (let i = 0; i < 10; i += 1) {
    const entity = engine.addEntity();
    const x = 2 + (i * 1.15) % 12;
    const z = 1.2 + (i % 3) * 0.45;
    Transform.create(entity, { position: Vector3.create(x, 2.8 + (i % 4) * 0.35, z), scale: Vector3.create(0.10, 0.10, 0.10) });
    MeshRenderer.setBox(entity);
    paint(entity, i % 2 ? COLORS.pink : COLORS.purple);
    addAmbientMotion(entity, 0.12, 0.15, i * 0.4, 3.1);
  }
}
```

---

# PAGE 22 — PROPOSAL DETAIL PANEL

A reusable detail panel keeps future live proposal selection possible without changing the pavilion architecture.

```ts
import { engine, TextShape, Transform, Billboard, VisibilityComponent } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { DaoProposal } from '../types';

export interface ProposalDetailPanel {
  root: number;
  title: number;
  body: number;
}

export function createProposalDetailPanel(position: Vector3): ProposalDetailPanel {
  const root = engine.addEntity();
  Transform.create(root, { position });
  const title = addText('SELECT A PROPOSAL', Vector3.create(position.x, position.y + 0.9, position.z), 0.65, COLORS.pink);
  const body = addText('Walk up to a proposal pedestal and explore the official DAO workflow.', Vector3.create(position.x, position.y, position.z), 0.35, COLORS.white);
  VisibilityComponent.create(root, { visible: false });
  return { root, title, body };
}

export function showProposalDetail(panel: ProposalDetailPanel, proposal: DaoProposal): void {
  VisibilityComponent.getMutable(panel.root).visible = true;
  TextShape.getMutable(panel.title).text = proposal.title;
  TextShape.getMutable(panel.body).text = `${proposal.summary} • ${proposal.stage.toUpperCase()} • ${proposal.yesPercent}% YES`;
}

function addText(text: string, position: Vector3, fontSize: number, textColor: any): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position });
  Billboard.create(entity);
  TextShape.create(entity, { text, fontSize, textColor });
  return entity;
}
```

---

# PAGE 23 — OVERVIEW BOARD API

The overview board gives the World a single entry point for the governance educational layer and can later be updated after a successful live refresh.

```ts
import { engine, TextShape, Transform, Billboard } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { DaoOverview } from '../types';

export function createGovernanceOverviewBoard(overview: DaoOverview): number[] {
  const entities: number[] = [];
  const lines = [
    'HOW DECENTRALAND DAO GOVERNANCE WORKS',
    'MANA • LAND • NAME VOTING POWER',
    'POLL → DRAFT → GOVERNANCE',
    'BINDING OUTCOMES ARE HANDLED THROUGH THE OFFICIAL GOVERNANCE SYSTEM',
    'DEMO WORLD SURFACE • VERIFY LIVE DETAILS IN THE DAO'
  ];
  lines.forEach((text, index) => {
    const entity = engine.addEntity();
    Transform.create(entity, { position: Vector3.create(8, 7.0 - index * 0.52, 8) });
    Billboard.create(entity);
    TextShape.create(entity, {
      text,
      fontSize: index === 0 ? 0.75 : 0.42,
      textColor: index === 0 ? COLORS.pink : COLORS.white
    });
    entities.push(entity);
  });
  return entities;
}

export function updateGovernanceOverviewBoard(_entities: number[], _overview: DaoOverview): void {
  // Reserved for live proposal refreshes and season/event state.
}
```

---

# PAGE 24 — PUBLIC LABEL HELPERS

World-space labels should be lightweight and reused. Keep typography decisions in one small helper.

```ts
import { engine, TextShape, Transform, Billboard } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';

export function addGovernanceLabel(text: string, position: Vector3, size = 0.45, color = COLORS.white): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position });
  Billboard.create(entity);
  TextShape.create(entity, {
    text,
    fontSize: size,
    textColor: color
  });
  return entity;
}

export function updateGovernanceLabel(entity: number, text: string): void {
  TextShape.getMutable(entity).text = text;
}
```

---

# PAGE 25 — PROPOSAL METRICS

Detailed proposal metrics are separated from the pedestal so richer layouts can be added without changing the underlying proposal object.

```ts
import { engine, TextShape, Transform, Billboard } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { DaoProposal } from '../types';

export function createProposalMetrics(proposal: DaoProposal, position: Vector3): void {
  const lines = [
    `YES ${proposal.yesPercent}%`,
    `NO ${proposal.noPercent}%`,
    `ABSTAIN ${proposal.abstainPercent}%`,
    `PARTICIPATING VP ${formatVP(proposal.participatingVP)}`,
    `THRESHOLD ${formatVP(proposal.acceptanceThresholdVP)}`
  ];

  lines.forEach((line, index) => {
    const entity = engine.addEntity();
    Transform.create(entity, { position: Vector3.create(position.x, position.y - index * 0.34, position.z) });
    Billboard.create(entity);
    TextShape.create(entity, {
      text: line,
      fontSize: 0.30,
      textColor: index === 0 ? COLORS.green : COLORS.white
    });
  });
}

function formatVP(vp: number): string {
  if (vp >= 1_000_000) return `${(vp / 1_000_000).toFixed(1)}M`;
  if (vp >= 1_000) return `${Math.round(vp / 1_000)}K`;
  return `${Math.round(vp)}`;
}
```

---

# PAGE 26 — GOVERNANCE BADGES

Compact physical badges reinforce the core action sequence: discuss, review, vote.

```ts
import { engine, MeshRenderer, Transform } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { COLORS } from '../../shared/constants';
import { paint } from '../visual/materialFactory';

export function createGovernanceBadges(position: Vector3): void {
  const labels = [
    { text: 'DISCUSS', color: COLORS.pink },
    { text: 'REVIEW', color: COLORS.purple },
    { text: 'VOTE', color: COLORS.sun }
  ];

  labels.forEach((item, index) => {
    const entity = engine.addEntity();
    Transform.create(entity, {
      position: Vector3.create(position.x - 1.8 + index * 1.8, position.y, position.z),
      scale: Vector3.create(1.35, 0.25, 0.6)
    });
    MeshRenderer.setBox(entity);
    paint(entity, item.color);
  });
}
```

---

# PAGE 27 — GOVERNANCE MODULE EXPORT

The module barrel keeps the feature discoverable and makes the governance subsystem portable.

```ts
export * from './types';
export * from './constants';
export * from './state';
export * from './controller';
export * from './data/overview';
export * from './data/demoProposals';
export * from './services/daoClient';
export * from './services/links';
export * from './services/metrics';
export * from './ui/pavilion';
export * from './ui/overviewBoard';
export * from './ui/proposalDetail';
export * from './ui/voteGuide';
export * from './ui/badges';
export * from './config';
export * from './services/workflow';
export * from './services/format';
export * from './services/health';
export * from './ui/workflowBoard';
export * from './ui/proposalStatus';
export * from './ui/terminal';
export * from './ui/particleAccent';
```

---

# PAGE 28 — WORLD INTEGRATION

The World entry point initializes the governance pavilion after the core Friendzone arena and social systems. This preserves the original game while making governance a physical destination inside the same 3D scene.

```ts
// Integration pattern added to src/world.ts
import { createDemoDaoOverview } from './governance/data/overview';
import { buildGovernancePavilion } from './governance/ui/pavilion';
import { createGovernanceOverviewBoard } from './governance/ui/overviewBoard';
import { createVoteGuide } from './governance/ui/voteGuide';
import { createGovernanceBadges } from './governance/ui/badges';
import { createGovernanceAccents } from './governance/ui/particleAccent';
import { createGovernanceTerminal } from './governance/ui/terminal';
import { createWorkflowBoard } from './governance/ui/workflowBoard';
import { createProposalStatus } from './governance/ui/proposalStatus';

function buildGovernanceExperience(): void {
  const overview = createDemoDaoOverview();
  buildGovernancePavilion(overview.proposals, 12.4);
  createGovernanceOverviewBoard(overview);
  createVoteGuide(Vector3.create(8, 5.0, 7.2));
  createGovernanceBadges(Vector3.create(8, 0.6, 9.6));
  createGovernanceAccents();
  createGovernanceTerminal(Vector3.create(8, 0.9, 8.7));
  createWorkflowBoard(overview, Vector3.create(8, 2.8, 11.1));
  if (overview.proposals[0]) {
    createProposalStatus(overview.proposals[0], Vector3.create(8, 6.0, 11.1));
  }
}
```

---

# PAGE 29 — WORLD UX MAP

The governance area should be physically discoverable from the core arena. The intended spatial relationship is:

ENTRANCE → ARENA → REMATCH → GOVERNANCE PLAZA

The player should be able to walk, turn, and encounter governance objects as part of the environment rather than selecting a 2D tab.

```ts
const GOVERNANCE_LAYOUT = {
  pavilionZ: 12.4,
  workflowBoardZ: 11.1,
  terminalZ: 8.7,
  overviewZ: 8.0,
  playerApproach: 'from-arena',
} as const;
```

---

# PAGE 30 — LIVE DATA ADAPTER CONTRACT

A production integration should expose only the data the World needs. Keep the API response small: proposal id, title, category, stage, summary, timing, vote percentages, participation, and canonical URLs.

```ts
export interface LiveGovernanceApiResponse {
  mode: 'live';
  sourceUrl: string;
  fetchedAt: string;
  proposals: Array<{
    id: string;
    title: string;
    category: string;
    stage: 'pre-proposal' | 'draft' | 'governance' | 'enacted' | 'rejected';
    summary: string;
    author?: string;
    createdAt: string;
    endAt?: string;
    yesPercent: number;
    noPercent: number;
    abstainPercent?: number;
    participatingVP: number;
    acceptanceThresholdVP: number;
    governanceUrl?: string;
    discussionUrl?: string;
    snapshotUrl?: string;
  }>;
}
```

---

# PAGE 31 — WORLD GOVERNANCE SECURITY BOUNDARY

Never put a private key, seed phrase, signing secret, or administrative credential in a Decentraland scene. The World is a client environment. Binding voting remains a separate trust boundary and the official governance site is the destination for that action.

```ts
export interface GovernanceSecurityPolicy {
  privateKeysInScene: false;
  secretCredentialsInScene: false;
  bindingVoteImplementedLocally: false;
  externalLinksMustBeExplicitClicks: true;
  demoDataMustBeMarked: true;
}

export const GOVERNANCE_SECURITY_POLICY: GovernanceSecurityPolicy = {
  privateKeysInScene: false,
  secretCredentialsInScene: false,
  bindingVoteImplementedLocally: false,
  externalLinksMustBeExplicitClicks: true,
  demoDataMustBeMarked: true
};
```

---

# PAGE 32 — DEPLOYMENT CHECKLIST

Before publishing, replace placeholder World configuration, verify official DAO links, verify proposal data freshness, run the SDK build, preview locally, and test every external link from an explicit player click. Decentraland documents npm run start for preview and npm run build for stricter type checking before deployment.

```ts
{
  "worldConfiguration": {
    "name": "YOUR-NAME.dcl.eth"
  }
}

# commands
npm install
npm run lint
npm run build
npm run start
npm run deploy
```

---

# PAGE 33 — JUDGE WALKTHROUGH

Recommended final demo:

1. Walk into the 3D arena.
2. Pull the rope using the physical arena interaction.
3. Walk toward the governance plaza.
4. Read the three governance stages on the physical board.
5. Inspect a proposal pedestal.
6. Click DISCUSS or DAO.
7. Show that the official governance interface opens externally.
8. Return to the World and continue playing.

This demonstrates that governance is part of the 3D world rather than a disconnected 2D dashboard.

```ts
const JUDGE_FLOW = [
  'ENTER_WORLD',
  'PLAY_ARENA',
  'DISCOVER_GOVERNANCE_PLAZA',
  'READ_WORKFLOW',
  'EXPLORE_PROPOSAL',
  'OPEN_OFFICIAL_DAO',
  'RETURN_TO_WORLD'
] as const;
```

---

# PAGE 34 — TESTING PLAN

Test the pure governance logic separately from the 3D scene. At minimum verify:

- stage ordering
- percentage clamping
- VP formatting
- proposal normalization
- demo fallback when the live endpoint fails
- canonical governance URLs
- demo labels
- no mutation of private credentials
- deterministic demo content

```ts
function assertPercent(value: number): number {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function assertPositiveVP(value: number): number {
  return Math.max(0, Number(value) || 0);
}

export function normalizeMetric(value: number): number {
  return assertPositiveVP(value);
}

export function normalizeVotePercent(value: number): number {
  return assertPercent(value);
}
```
