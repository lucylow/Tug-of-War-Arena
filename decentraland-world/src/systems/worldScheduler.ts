type Task = { name: string; everyMs: number; acc: number; run: () => void; dispose?: () => void }

const tasks: Task[] = []
let systemBound = false
let disposed = false

export function schedule(name: string, everyMs: number, run: () => void, dispose?: () => void): void {
  tasks.push({ name, everyMs, acc: 0, run, dispose })
}

export function startWorldScheduler(addSystem: (fn: (dt: number) => void) => void): void {
  if (systemBound) return
  systemBound = true
  addSystem(function worldScheduler(dt: number) {
    if (disposed) return
    const ms = dt * 1000
    for (const task of tasks) {
      if (task.everyMs <= 0) {
        task.run()
        continue
      }
      task.acc += ms
      if (task.acc >= task.everyMs) {
        task.acc = 0
        try {
          task.run()
        } catch {
          // Subsystem isolation: a slow task must not stop gameplay.
        }
      }
    }
  })
}

export function disposeWorldScheduler(): void {
  disposed = true
  for (const task of tasks) {
    try {
      task.dispose?.()
    } catch {
      // Ignore.
    }
  }
  tasks.length = 0
}
