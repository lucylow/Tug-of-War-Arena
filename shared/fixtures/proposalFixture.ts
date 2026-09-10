import { DAO_FORUM_URL, DAO_OFFICIAL_URL, DAO_SNAPSHOT_URL, type WorldProposal } from "../proposal";

export const proposalFixture: WorldProposal[] = [
  {
    id: "demo-poi-friendzone",
    title: "Add Friendzone Arena as a community discovery destination",
    summary: "Demonstration proposal for a community destination.",
    stage: "poll",
    status: "demo",
    createdAt: 1_725_500_000_000,
    endsAt: 1_726_000_000_000,
    origin: "demo",
    snapshotReference: DAO_SNAPSHOT_URL,
    officialUrl: DAO_OFFICIAL_URL,
  },
  {
    id: "demo-community-event",
    title: "Fund a community social-game event series",
    summary: "Demonstration grant proposal for recurring social events.",
    stage: "draft",
    status: "demo",
    createdAt: 1_725_400_000_000,
    endsAt: 1_725_900_000_000,
    origin: "demo",
    snapshotReference: DAO_SNAPSHOT_URL,
    officialUrl: DAO_OFFICIAL_URL,
  },
  {
    id: "demo-governance-stage",
    title: "Improve discovery surfaces for social experiences",
    summary: "Demonstration governance proposal. Binding votes stay on the official interface.",
    stage: "governance",
    status: "demo",
    createdAt: 1_725_200_000_000,
    endsAt: 1_725_800_000_000,
    origin: "demo",
    snapshotReference: DAO_SNAPSHOT_URL,
    officialUrl: DAO_OFFICIAL_URL,
  },
];

export const proposalDiscussionUrl = DAO_FORUM_URL;
