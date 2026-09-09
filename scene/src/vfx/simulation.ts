/**
 * CPU particle stepping used by unit tests and as the reference motion
 * model for mesh-based glow / confetti. Native SDK emitters handle the
 * live dust/firefly/rain population on the GPU.
 */

export type SimVec3 = { x: number; y: number; z: number }

export type SimParticle = {
  position: SimVec3
  velocity: SimVec3
  life: number
  maxLife: number
  size: number
  active: boolean
}

export type SimConfetti = SimParticle & {
  rotation: SimVec3
  spin: SimVec3
}

export function stepSimParticle(particle: SimParticle, dt: number, gravity: number): void {
  if (!particle.active) return
  particle.life += dt
  particle.position.x += particle.velocity.x * dt
  particle.position.y += particle.velocity.y * dt
  particle.position.z += particle.velocity.z * dt
  particle.velocity.y -= gravity * dt
  if (particle.life >= particle.maxLife) {
    particle.active = false
  }
}

export function dustBounds(particle: SimParticle, halfSpread: number = 9): void {
  if (Math.abs(particle.position.x) > halfSpread) particle.velocity.x *= -0.5
  if (Math.abs(particle.position.z) > halfSpread) particle.velocity.z *= -0.5
  if (particle.position.y < 0.2) particle.velocity.y = Math.abs(particle.velocity.y) * 0.5
  if (particle.position.y > 3.5) particle.velocity.y *= -0.5
}

export function lifeScale(particle: SimParticle, shrink: number = 0.5): number {
  if (particle.maxLife <= 0) return 0
  const lifeRatio = particle.life / particle.maxLife
  return particle.size * (1 - lifeRatio * shrink)
}

export function createDustField(count: number, spread: number = 18): SimParticle[] {
  const particles: SimParticle[] = []
  for (let i = 0; i < count; i += 1) {
    particles.push({
      position: {
        x: (Math.random() - 0.5) * spread,
        y: 0.5 + Math.random() * 3,
        z: (Math.random() - 0.5) * spread,
      },
      velocity: {
        x: (Math.random() - 0.5) * 0.15,
        y: (Math.random() - 0.5) * 0.09,
        z: (Math.random() - 0.5) * 0.15,
      },
      life: Math.random() * 10,
      maxLife: 5 + Math.random() * 5,
      size: 0.08,
      active: true,
    })
  }
  return particles
}

export function recycleDust(particle: SimParticle, spread: number = 18): void {
  particle.active = true
  particle.life = 0
  particle.maxLife = 5 + Math.random() * 5
  particle.position.x = (Math.random() - 0.5) * spread
  particle.position.y = 0.5 + Math.random() * 3
  particle.position.z = (Math.random() - 0.5) * spread
  particle.velocity.x = (Math.random() - 0.5) * 0.15
  particle.velocity.y = (Math.random() - 0.5) * 0.09
  particle.velocity.z = (Math.random() - 0.5) * 0.15
}

export function stepDustField(particles: SimParticle[], dt: number, spread: number = 18): void {
  const halfSpread = spread * 0.5
  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i]
    if (!particle || !particle.active) continue
    stepSimParticle(particle, dt, 0.01)
    dustBounds(particle, halfSpread)
    if (!particle.active) recycleDust(particle, spread)
  }
}

export function stepConfetti(piece: SimConfetti, dt: number): void {
  if (!piece.active) return
  stepSimParticle(piece, dt, 0.5)
  piece.rotation.x += piece.spin.x * dt
  piece.rotation.y += piece.spin.y * dt
  piece.rotation.z += piece.spin.z * dt
  if (piece.position.y < 0) {
    piece.position.y = 0
    piece.velocity.y *= -0.3
  }
}

export function stepSparkScale(scale: number, shrink: number = 0.98): number {
  return scale * shrink
}

export function glowFrame(
  elapsed: number,
  duration: number,
  maxScale: number,
): { done: boolean; progress: number; scale: number; alpha: number } {
  const progress = duration <= 0 ? 1 : elapsed / duration
  if (progress >= 1) {
    return { done: true, progress: 1, scale: 0, alpha: 0 }
  }
  return {
    done: false,
    progress,
    scale: 0.1 + progress * maxScale,
    alpha: 1 - progress,
  }
}

export function fireflyChase(current: SimVec3, target: SimVec3, dt: number, life: number): SimVec3 {
  const speed = 0.5 + 0.5 * Math.sin(life * 0.3)
  return {
    x: current.x + (target.x - current.x) * dt * speed * 0.5,
    y: current.y + (target.y - current.y) * dt * speed * 0.3,
    z: current.z + (target.z - current.z) * dt * speed * 0.5,
  }
}

export function rainResetY(y: number, speed: number, dt: number, floorY: number = 0): { y: number; wrapped: boolean } {
  const next = y - speed * dt
  if (next < floorY) return { y: 5 + Math.random() * 5, wrapped: true }
  return { y: next, wrapped: false }
}
