import { comboDuration } from './budgets'

export type ComboPopup = {
  active: boolean
  text: string
  count: number
  age: number
  duration: number
}

const TAP_WINDOW_SECONDS = 0.85

let comboCount = 0
let lastTapAt = Number.NEGATIVE_INFINITY
let popup: ComboPopup = {
  active: false,
  text: '',
  count: 0,
  age: 0,
  duration: 1.5,
}

export function registerComboTap(now: number, windowSeconds: number = TAP_WINDOW_SECONDS): number {
  if (now - lastTapAt > windowSeconds) comboCount = 0
  comboCount += 1
  lastTapAt = now
  return comboCount
}

export function currentCombo(): number {
  return comboCount
}

export function showComboPopup(count: number, mobile: boolean = false): ComboPopup {
  popup = {
    active: true,
    text: `${Math.max(1, Math.floor(count))}x Combo!`,
    count: Math.max(1, Math.floor(count)),
    age: 0,
    duration: comboDuration(mobile),
  }
  return popup
}

export function tickComboPopup(dt: number): ComboPopup {
  if (!popup.active) return popup
  popup.age += dt
  if (popup.age >= popup.duration) {
    popup.active = false
  }
  return popup
}

export function getComboPopup(): ComboPopup {
  return popup
}

export function comboAlpha(state: ComboPopup = popup): number {
  if (!state.active || state.duration <= 0) return 0
  return Math.max(0, 1 - state.age / state.duration)
}

export function hideComboPopup(): void {
  popup.active = false
}

export function resetCombo(): void {
  comboCount = 0
  lastTapAt = Number.NEGATIVE_INFINITY
  hideComboPopup()
}
