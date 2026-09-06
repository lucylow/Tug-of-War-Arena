import { describe, expect, it } from "vitest";

import { formatPlazaHandoffAccessibility, type PlazaHandoffAction, type PlazaHandoffTarget } from "../lib/bridge-flow";

const targets: PlazaHandoffTarget[] = ["copy", "share", "open"];
const actions: PlazaHandoffAction[] = ["idle", "copying", "sharing", "opening"];

describe("Plaza handoff UI accessibility contract", () => {
  it.each(targets)("keeps %s idle controls enabled with an action-specific label and hint", (target) => {
    const props = formatPlazaHandoffAccessibility(target, "idle");

    expect(props.disabled).toBe(false);
    expect(props.busy).toBe(false);
    expect(props.label).not.toMatch(/Wait|ing/);
    expect(props.hint).toMatch(/Copies|Opens/);
  });

  it.each(targets)("disables %s while another Plaza handoff is active", (target) => {
    for (const action of actions.slice(1)) {
      const props = formatPlazaHandoffAccessibility(target, action);
      expect(props.disabled).toBe(true);
      expect(props.hint).toBe("Wait for the current Plaza handoff to finish");
    }
  });

  it("marks only the active Plaza handoff target as busy", () => {
    expect(formatPlazaHandoffAccessibility("copy", "copying").busy).toBe(true);
    expect(formatPlazaHandoffAccessibility("share", "copying").busy).toBe(false);
    expect(formatPlazaHandoffAccessibility("open", "copying").busy).toBe(false);
    expect(formatPlazaHandoffAccessibility("share", "sharing").busy).toBe(true);
    expect(formatPlazaHandoffAccessibility("open", "opening").busy).toBe(true);
  });
});
