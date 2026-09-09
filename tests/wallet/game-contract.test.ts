import { ethers } from "ethers";
import { describe, expect, it } from "vitest";

import { TUG_OF_WAR_ARENA_ABI } from "../../lib/web3/abi";
import { decodeMatchCreated, decodeMatchView, decodePlayerInMatch, formatMatchStatus, formatMatchTeam, formatTokenAmount } from "../../lib/web3/match";

describe("game contract view decoding", () => {
  it("decodes a TugOfWarArena getMatch tuple", () => {
    const view = decodeMatchView([
      3n,
      ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"],
      1700000000n,
      1700000030n,
      2,
      0,
      20000000000000000000n,
      50n,
      12n,
    ]);

    expect(view).toEqual({
      id: "3",
      players: ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"],
      startTime: "1700000000",
      endTime: "1700000030",
      status: 2,
      winner: 0,
      prizePool: "20.0",
      sunPower: "50",
      moonPower: "12",
    });
    expect(formatMatchStatus(view.status)).toBe("Finished");
    expect(formatMatchTeam(view.winner)).toBe("Sun");
    expect(decodePlayerInMatch(["0x1111111111111111111111111111111111111111", "CrewLead", 0, 12n, true])).toEqual({
      wallet: "0x1111111111111111111111111111111111111111",
      displayName: "CrewLead",
      team: 0,
      power: "12",
      isReady: true,
    });
  });

  it("rejects incomplete payloads instead of inventing match state", () => {
    expect(() => decodeMatchView([])).toThrow("Invalid match payload");
    expect(() => decodeMatchView(null)).toThrow("Invalid match payload");
  });

  it("formats FZONE amounts and treats invalid values as zero", () => {
    expect(formatTokenAmount(1000000000000000000n)).toBe("1.0");
    expect(formatTokenAmount("not-a-token")).toBe("0");
  });

  it("reads MatchCreated from a live transaction receipt", () => {
    const iface = new ethers.Interface(TUG_OF_WAR_ARENA_ABI);
    const event = iface.getEvent("MatchCreated");
    if (!event) throw new Error("MatchCreated missing from ABI");
    const log = iface.encodeEventLog(event, [
      9n,
      "0x1111111111111111111111111111111111111111",
      "CrewLead",
    ]);
    expect(decodeMatchCreated({ hash: `0x${"11".repeat(32)}`, logs: [log] })).toEqual({
      hash: `0x${"11".repeat(32)}`,
      matchId: "9",
    });
  });
});
