export type InteractionScheduler = (task: () => void) => { cancel: () => void };

export function createImmediateScheduler(): InteractionScheduler {
  return (task) => {
    const id = setTimeout(task, 0);
    return { cancel: () => clearTimeout(id) };
  };
}

export function scheduleAfterInteractions(
  task: () => void,
  scheduler: InteractionScheduler = createImmediateScheduler(),
): { cancel: () => void } {
  return scheduler(task);
}
