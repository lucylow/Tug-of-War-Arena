export const WORLD_COPY = {
  enterArena: "ENTER THE ARENA",
  chooseCrew: "CHOOSE YOUR CREW",
  pull: "PULL",
  react: "REACT",
  rematch: "REMATCH",
  viewEvents: "VIEW EVENTS",
  governance: "GOVERNANCE",
  achievements: "ACHIEVEMENTS",
  enterWorld: "ENTER WORLD",
  welcome: "WELCOME TO FRIENDZONE",
  friendzoneWorld: "FRIENDZONE WORLD",
  socialArena: "3D SOCIAL ARENA",
  demoLeaderboard: "DEMO LEADERBOARD",
  continueOfficialDao: "Continue to the official governance interface.",
  inviteExpired: "Invite link expired or unavailable.",
  versionIncompatible: "This World version is not compatible with this app build.",
  wrongNetwork: "WRONG NETWORK",
  addNetwork: "Add the supported network to continue.",
  proofFailed: "Blockchain proof could not be completed.",
  proofSavedLocally: "Your match is still saved locally.",
} as const;

export const MOBILE_COPY = {
  play: "PLAY",
  joinCrew: "JOIN CREW",
  enterWorld: "ENTER 3D WORLD",
  missions: "MISSIONS",
  leaderboard: "LEADERBOARD",
  achievements: "ACHIEVEMENTS",
  connectWallet: "CONNECT WALLET",
  continueDemo: "CONTINUE DEMO",
  governance: "GOVERNANCE",
  rematch: "REMATCH",
  inviteCrew: "INVITE CREW",
  somethingWentWrong: "Something went wrong",
  tryAgain: "TRY AGAIN",
  returnToCrew: "RETURN TO CREW",
} as const;

export const TUTORIAL_WORLD_STEPS = [
  "Choose Sun or Moon.",
  "Walk to the PULL pad.",
  "Pull the rope.",
  "React.",
  "View results.",
  "Explore the World.",
] as const;

export const TUTORIAL_MOBILE_CARDS = [
  { id: "join", title: "JOIN A CREW" },
  { id: "pull", title: "PULL TO PLAY" },
  { id: "react", title: "REACT WITH FRIENDS" },
  { id: "world", title: "ENTER THE 3D WORLD" },
  { id: "streak", title: "BUILD YOUR STREAK" },
] as const;
