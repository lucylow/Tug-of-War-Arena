/**
 * QualityManager holds named presets and notifies listeners when the
 * arena should drop LODs, particles, shadows, or draw distance.
 */

import { isMobileClient } from './platform'

export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'minimal'

export interface QualitySettings {
  shadowsEnabled: boolean
  shadowResolution: 512 | 1024 | 2048
  particleCount: number
  textureQuality: 'high' | 'medium' | 'low'
  lodLevel: 'high' | 'medium' | 'low'
  antiAliasing: boolean
  postProcessing: boolean
  drawDistance: number
  maxEntities: number
  weatherIntensity: number
  lightIntensityScale: number
}

export type QualityListener = (level: QualityLevel, settings: QualitySettings) => void

export const QUALITY_LEVELS: QualityLevel[] = ['ultra', 'high', 'medium', 'low', 'minimal']

export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  ultra: {
    shadowsEnabled: true,
    shadowResolution: 2048,
    particleCount: 200,
    textureQuality: 'high',
    lodLevel: 'high',
    antiAliasing: true,
    postProcessing: true,
    drawDistance: 30,
    maxEntities: 10000,
    weatherIntensity: 1,
    lightIntensityScale: 1,
  },
  high: {
    shadowsEnabled: true,
    shadowResolution: 1024,
    particleCount: 150,
    textureQuality: 'high',
    lodLevel: 'high',
    antiAliasing: true,
    postProcessing: true,
    drawDistance: 25,
    maxEntities: 8000,
    weatherIntensity: 0.85,
    lightIntensityScale: 1,
  },
  medium: {
    shadowsEnabled: true,
    shadowResolution: 512,
    particleCount: 80,
    textureQuality: 'medium',
    lodLevel: 'medium',
    antiAliasing: false,
    postProcessing: false,
    drawDistance: 20,
    maxEntities: 6000,
    weatherIntensity: 0.55,
    lightIntensityScale: 0.85,
  },
  low: {
    shadowsEnabled: false,
    shadowResolution: 512,
    particleCount: 30,
    textureQuality: 'low',
    lodLevel: 'low',
    antiAliasing: false,
    postProcessing: false,
    drawDistance: 15,
    maxEntities: 4000,
    weatherIntensity: 0.25,
    lightIntensityScale: 0.7,
  },
  minimal: {
    shadowsEnabled: false,
    shadowResolution: 512,
    particleCount: 0,
    textureQuality: 'low',
    lodLevel: 'low',
    antiAliasing: false,
    postProcessing: false,
    drawDistance: 10,
    maxEntities: 2000,
    weatherIntensity: 0,
    lightIntensityScale: 0.55,
  },
}

export function venueLodFromQuality(level: QualityLevel): 'high' | 'medium' | 'low' {
  return QUALITY_PRESETS[level].lodLevel
}

export class QualityManager {
  private static instance: QualityManager | null = null

  private currentLevel: QualityLevel
  private settings: QualitySettings
  private listeners: QualityListener[] = []

  private constructor() {
    const defaultLevel: QualityLevel = isMobileClient() ? 'medium' : 'high'
    this.currentLevel = defaultLevel
    this.settings = { ...QUALITY_PRESETS[defaultLevel] }
  }

  static getInstance(): QualityManager {
    if (!QualityManager.instance) {
      QualityManager.instance = new QualityManager()
    }
    return QualityManager.instance
  }

  static resetInstance(): void {
    QualityManager.instance = null
  }

  setQuality(level: QualityLevel): void {
    if (level === this.currentLevel) return
    this.currentLevel = level
    this.settings = { ...QUALITY_PRESETS[level] }
    this.notifyListeners()
  }

  getLevel(): QualityLevel {
    return this.currentLevel
  }

  getSettings(): QualitySettings {
    return { ...this.settings }
  }

  onQualityChange(callback: QualityListener): void {
    this.listeners.push(callback)
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentLevel, this.settings)
    }
  }

  reduceQuality(): boolean {
    const currentIndex = QUALITY_LEVELS.indexOf(this.currentLevel)
    const nextLevel = QUALITY_LEVELS[currentIndex + 1]
    if (!nextLevel) return false
    this.setQuality(nextLevel)
    return true
  }

  increaseQuality(): boolean {
    const currentIndex = QUALITY_LEVELS.indexOf(this.currentLevel)
    if (currentIndex <= 0) return false
    const prevLevel = QUALITY_LEVELS[currentIndex - 1]
    if (!prevLevel) return false
    this.setQuality(prevLevel)
    return true
  }

  getRecommendedLevel(): QualityLevel {
    return isMobileClient() ? 'medium' : 'high'
  }
}
