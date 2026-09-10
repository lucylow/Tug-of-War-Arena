import { SIMULATED_PROFILES } from "../../shared/playerProfiles";
import { DemoWorldClock } from "../../shared/clock";
import { roomFixture } from "../../shared/fixtures/roomFixture";
import { missionFixture } from "../../shared/fixtures/missionFixture";
import { MAX_REACTION_EFFECTS, MAX_VISIBLE_ACTIVITY } from "../../shared/budgets";

export interface DemoSimulationState {
  paused: boolean;
  tick: number;
  sunScore: number;
  moonScore: number;
  players: Array<{ id: string; x: number; z: number; pose: "idle" | "walk" | "celebrate" }>;
  reactions: Array<{ id: string; emoji: string; from: string }>;
  activity: string[];
  roomCode: string;
  missions: Array<{ id: string; progress: number; target: number }>;
}

const WAYPOINTS = [
  { x: 5, z: 16 },
  { x: 16, z: 16 },
  { x: 27, z: 16 },
  { x: 16, z: 24 },
];

export function createDemoSimulation(clock: DemoWorldClock): {
  state: () => DemoSimulationState;
  tick: () => DemoSimulationState;
  pause: () => void;
  resume: () => void;
  reset: () => void;
} {
  const profiles = Object.values(SIMULATED_PROFILES);
  let state: DemoSimulationState = initialState();

  function initialState(): DemoSimulationState {
    return {
      paused: false,
      tick: 0,
      sunScore: 428,
      moonScore: 381,
      players: profiles.map((profile, index) => ({
        id: profile.id,
        x: WAYPOINTS[index % WAYPOINTS.length]!.x,
        z: WAYPOINTS[index % WAYPOINTS.length]!.z,
        pose: "idle",
      })),
      reactions: [],
      activity: ["NovaWisp joined", "PixelRally won"],
      roomCode: roomFixture.featured.code,
      missions: missionFixture.map((mission) => ({ id: mission.id, progress: mission.progress, target: mission.target })),
    };
  }

  return {
    state: () => state,
    pause() {
      state = { ...state, paused: true };
      clock.pause();
    },
    resume() {
      state = { ...state, paused: false };
      clock.resume();
    },
    reset() {
      clock.reset();
      state = initialState();
    },
    tick() {
      if (state.paused) return state;
      clock.advance(250);
      const nextTick = state.tick + 1;
      const players = state.players.map((player, index) => {
        const waypoint = WAYPOINTS[(index + nextTick) % WAYPOINTS.length]!;
        const pose: DemoSimulationState["players"][number]["pose"] =
          nextTick % 12 === 0 ? "celebrate" : nextTick % 2 === 0 ? "walk" : "idle";
        return { ...player, x: waypoint.x, z: waypoint.z, pose };
      });
      const sunBump = nextTick % 3 === 0 ? 1 : 0;
      const moonBump = nextTick % 4 === 0 ? 1 : 0;
      const reactions =
        nextTick % 5 === 0
          ? [{ id: `rx_${nextTick}`, emoji: "🔥", from: "PixelRally" }, ...state.reactions].slice(0, MAX_REACTION_EFFECTS)
          : state.reactions.slice(0, MAX_REACTION_EFFECTS);
      const activity = [`${profiles[nextTick % profiles.length]!.id} pulled`, ...state.activity].slice(
        0,
        MAX_VISIBLE_ACTIVITY,
      );
      state = {
        ...state,
        tick: nextTick,
        players,
        sunScore: state.sunScore + sunBump,
        moonScore: state.moonScore + moonBump,
        reactions,
        activity,
      };
      return state;
    },
  };
}
