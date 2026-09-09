import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { formatScore, formatTimer, powerBarWidth } from './logic/mapping'
import { cloud, gold, midnight, moon, sun, withAlpha } from './palette'
import { getPerformanceSnapshot } from './performance/PerformanceMonitorUI'
import { cycleWeather, queueTap, restartMatch, session } from './systems/session'
import { SocialOverlay } from './ui/SocialOverlay'
import { getUiRendererOptions } from './ui/safeArea'
import { hudButtonSize } from './ui/sizing'
import { comboAlpha, getComboPopup } from './vfx/comboState'

export function setupUI() {
  ReactEcsRenderer.setUiRenderer(ArenaHud, getUiRendererOptions())
}

function ArenaHud() {
  const { state } = session
  const mobile = isMobile()
  const meterWidth = mobile ? 220 : 280
  const sunWidth = powerBarWidth(state.sunPower, meterWidth)
  const moonWidth = powerBarWidth(state.moonPower, meterWidth)

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: mobile ? 'center' : 'space-between',
        alignItems: 'center',
        padding: mobile
          ? { top: 20, bottom: 24, left: 24, right: 24 }
          : { top: 24, bottom: 28, left: 32, right: 32 },
      }}
    >
      <Vignette />
      <ComboBanner />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: mobile ? 88 : 96,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <UiEntity
          uiTransform={{ width: 220, height: 56 }}
          uiText={{ value: formatTimer(state.timeRemaining), fontSize: mobile ? 36 : 42, color: gold, textAlign: 'middle-center' }}
        />
        <UiEntity
          uiTransform={{ width: 260, height: 32 }}
          uiText={{ value: formatScore(state.score[0], state.score[1]), fontSize: mobile ? 20 : 22, color: cloud, textAlign: 'middle-center' }}
        />
      </UiEntity>

      <UiEntity
        uiTransform={{
          width: mobile ? 240 : '100%',
          height: mobile ? 140 : 72,
          display: 'flex',
          flexDirection: mobile ? 'column' : 'row',
          justifyContent: mobile ? 'center' : 'space-between',
          alignItems: 'center',
        }}
      >
        {powerMeter('SUN', sun, sunWidth, meterWidth)}
        {powerMeter('MOON', moon, moonWidth, meterWidth)}
      </UiEntity>

      <UiEntity
        uiTransform={{
          width: '100%',
          height: mobile ? 72 : 70,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {hudButton('PULL', () => queueTap(1), gold)}
        {hudButton(state.weather.toUpperCase(), () => cycleWeather(), moon)}
        {hudButton(state.phase === 'results' ? 'REMATCH' : 'RESET', () => restartMatch(), cloud)}
      </UiEntity>
      {PerformanceOverlay()}
      <SocialOverlay />
    </UiEntity>
  )
}

function powerMeter(label: string, color: Color4, fillWidth: number, trackWidth: number) {
  return (
    <UiEntity uiTransform={{ width: trackWidth + 20, height: 54, display: 'flex', flexDirection: 'column' }}>
      <UiEntity uiTransform={{ width: 120, height: 20 }} uiText={{ value: label, fontSize: 16, color: color }} />
      <UiEntity uiTransform={{ width: trackWidth, height: 18 }} uiBackground={{ color: withAlpha(midnight, 0.92) }}>
        <UiEntity uiTransform={{ width: fillWidth, height: 18 }} uiBackground={{ color }} />
      </UiEntity>
    </UiEntity>
  )
}

function hudButton(label: string, onMouseDown: () => void, color: Color4) {
  const size = hudButtonSize()
  return (
    <UiEntity
      uiTransform={{ width: size.width, height: size.height, margin: { left: 10, right: 10 } }}
      uiBackground={{ color: withAlpha(midnight, 0.92) }}
      uiText={{ value: label, fontSize: size.fontSize, color, textAlign: 'middle-center' }}
      onMouseDown={onMouseDown}
    />
  )
}

function ComboBanner() {
  const popup = getComboPopup()
  if (!popup.active) {
    return <UiEntity uiTransform={{ width: 0, height: 0 }} />
  }
  const mobile = isMobile()
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: '36%' },
        width: '100%',
        height: mobile ? 72 : 88,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      uiText={{
        value: popup.text,
        fontSize: mobile ? 42 : 56,
        color: withAlpha(gold, comboAlpha(popup)),
        textAlign: 'middle-center',
      }}
    />
  )
}

function Vignette() {
  const edge = withAlpha(Color4.create(0, 0, 0, 1), 0.28)
  return <UiEntity uiTransform={{ width: '100%', height: 36 }} uiBackground={{ color: edge }} />
}

function PerformanceOverlay() {
  const snap = getPerformanceSnapshot()
  if (!snap.visible) {
    return <UiEntity uiTransform={{ width: 0, height: 0 }} />
  }
  const fpsColor = snap.avgFps < 30 ? Color4.create(1, 0.27, 0.27, 1) : cloud
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { left: '32%', top: '10%' },
        width: 280,
        height: 110,
      }}
      uiBackground={{ color: withAlpha(midnight, 0.78) }}
      uiText={{
        value: snap.lines.join('\n'),
        fontSize: 12,
        color: fpsColor,
        textAlign: 'middle-left',
      }}
    />
  )
}
