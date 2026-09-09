import { describe, expect, it } from "vitest";

import { parseStoredUser } from "../lib/auth-user";

describe("stored user recovery", () => {
  it("accepts a valid cached user and coerces the signed-in date", () => {
    const user = parseStoredUser({
      id: 7,
      openId: "player-1",
      name: "Sun Crew",
      email: "sun@example.com",
      loginMethod: "manus",
      lastSignedIn: "2026-09-08T12:00:00.000Z",
    });
    expect(user).toMatchObject({
      id: 7,
      openId: "player-1",
      name: "Sun Crew",
      email: "sun@example.com",
      loginMethod: "manus",
    });
    expect(user?.lastSignedIn.toISOString()).toBe("2026-09-08T12:00:00.000Z");
  });

  it("rejects malformed or incomplete cached users", () => {
    expect(parseStoredUser(null)).toBeNull();
    expect(parseStoredUser("player-1")).toBeNull();
    expect(parseStoredUser({ id: 1, name: "Missing openId" })).toBeNull();
    expect(parseStoredUser({ openId: "   " })).toBeNull();
  });

  it("recovers optional fields and invalid dates without throwing", () => {
    const user = parseStoredUser({
      openId: "player-2",
      id: "not-a-number",
      name: 12,
      lastSignedIn: "not-a-date",
    });
    expect(user).toMatchObject({
      id: 0,
      openId: "player-2",
      name: null,
      email: null,
      loginMethod: null,
    });
    expect(user?.lastSignedIn).toBeInstanceOf(Date);
    expect(Number.isNaN(user?.lastSignedIn.getTime())).toBe(false);
  });
});
