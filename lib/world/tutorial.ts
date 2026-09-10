const TUTORIAL_KEY = "friendzone.tutorialCompleted";

export function tutorialStorageKey(): string {
  return TUTORIAL_KEY;
}

export async function loadTutorialCompleted(read: (key: string) => Promise<string | null>): Promise<boolean> {
  try {
    return (await read(TUTORIAL_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function saveTutorialCompleted(write: (key: string, value: string) => Promise<unknown>, completed: boolean): Promise<void> {
  try {
    await write(TUTORIAL_KEY, completed ? "true" : "false");
  } catch {
    // Tutorial state is optional.
  }
}
