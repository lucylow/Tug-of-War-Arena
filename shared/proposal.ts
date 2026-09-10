export type ProposalStage = "poll" | "draft" | "governance";
export type ProposalStatus = "open" | "closed" | "demo";

export interface WorldProposal {
  id: string;
  title: string;
  summary: string;
  stage: ProposalStage;
  status: ProposalStatus;
  createdAt: number;
  endsAt: number;
  origin: "demo" | "live";
  snapshotReference: string | null;
  officialUrl: string;
}

export const DAO_OFFICIAL_URL = "https://governance.decentraland.org/";
export const DAO_FORUM_URL = "https://forum.decentraland.org/";
export const DAO_SNAPSHOT_URL = "https://snapshot.org/#/snapshot.dao.decentraland.eth";
