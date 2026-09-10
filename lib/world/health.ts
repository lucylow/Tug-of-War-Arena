export type HealthStatus = "ready" | "degraded" | "offline" | "error";

export interface WorldHealth {
  arena: HealthStatus;
  social: HealthStatus;
  events: HealthStatus;
  governance: HealthStatus;
  blockchain: HealthStatus;
  sync: HealthStatus;
}

export function createWorldHealth(): WorldHealth {
  return {
    arena: "ready",
    social: "ready",
    events: "ready",
    governance: "ready",
    blockchain: "offline",
    sync: "ready",
  };
}

export function meaningfulHealth(health: WorldHealth): Partial<WorldHealth> {
  const out: Partial<WorldHealth> = {};
  (Object.keys(health) as (keyof WorldHealth)[]).forEach((key) => {
    const status = health[key];
    if (status === "degraded" || status === "error") out[key] = status;
  });
  return out;
}

export function recoverSubsystem(health: WorldHealth, key: keyof WorldHealth): WorldHealth {
  return { ...health, [key]: "ready" };
}
