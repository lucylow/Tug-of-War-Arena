import { describe, expect, it } from "vitest";

import { createCanonicalWorldFeed } from "../../shared/demo-world";
import { worldFeedFromHybrid } from "../../lib/world/projection";
import { createHybridWorldDataset } from "../../lib/hybrid-world";

describe("friendzone hybrid projection", () => {
  it("keeps 2D companion data tagged as demo", () => {
    const hybrid = createHybridWorldDataset();
    const feed = worldFeedFromHybrid(hybrid);
    expect(feed.origin).toBe("demo");
    expect(feed.players[0]?.displayName).toBe("NovaWisp");
    expect(feed.rooms[0]?.code).toBe("731XZ");
    expect(createCanonicalWorldFeed().players.map((player) => player.displayName)).toEqual(
      expect.arrayContaining(["ArenaFox", "TorqueKid", "StarGrip"]),
    );
  });
});
