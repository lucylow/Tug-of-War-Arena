import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { isExplorerMobile } from './utils/platform'

import { formatScore, formatTimer, powerBarWidth } from './logic/mapping'
import { getArenaHudPolicy } from './logic/mobileRuntime'
import { cloud, gold, midnight, moon, sun, withAlpha } from './palette'
import { getPerformanceSnapshot } from './performance/PerformanceMonitorUI'
import { cycleWeather, queueTap, restartMatch, session } from './systems/session'
import { SocialOverlay } from './ui/SocialOverlay'
import { getUiRendererOptions } from './ui/safeArea'
import { comboAlpha, getComboPopup } from './vfx/comboState'

export function setupUI() {
  ReactEcsRenderer.setUiRenderer(ArenaHud, getUiRendererOptions())
}

function ArenaHud() {
  const { state } = session
  const mobile = isExplorerMobile()
  const policy = getArenaHudPolicy(mobile)
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
        justifyContent: policy.justifyContent,
        alignItems: 'center',
        padding: mobile
          ? { top: 20, bottom: 24, left: 24, right: 24 }
          : { top: 24, bottom: 28, left: 32, right: 32 },
      }}
    >
      {policy.showVignette ? <Vignette /> : <UiEntity uiTransform={{ width: 0, height: 0 }} />}
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
          height: policy.stackMeters ? 140 : 72,
          display: 'flex',
          flexDirection: policy.stackMeters ? 'column' : 'row',
          justifyContent: policy.stackMeters ? 'center' : 'space-between',
          alignItems: 'center',
        }}
      >
        {powerMeter('SUN', sun, sunWidth, meterWidth)}
        {powerMeter('MOON', moon, moonWidth, meterWidth)}
      </UiEntity>

      <UiEntity
        uiTransform={{
          width: '100%',
          height: mobile ? 80 : 70,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {hudButton('PULL', () => queueTap(1), gold, { width: policy.pullWidth, height: policy.pullHeight, fontSize: policy.fontSize })}
        {policy.showWeather
          ? hudButton(state.weather.toUpperCase(), () => cycleWeather(), moon, {
              width: policy.secondaryWidth,
              height: policy.secondaryHeight,
              fontSize: policy.fontSize,
            })
          : <UiEntity uiTransform={{ width: 0, height: 0 }} />}
        {hudButton(state.phase === 'results' ? 'REMATCH' : 'RESET', () => restartMatch(), cloud, {
          width: policy.secondaryWidth,
          height: policy.secondaryHeight,
          fontSize: policy.fontSize,
        })}
      </UiEntity>
      {PerformanceOverlay()}
      {policy.showSocial ? <SocialOverlay /> : <UiEntity uiTransform={{ width: 0, height: 0 }} />}
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

function hudButton(
  label: string,
  onMouseDown: () => void,
  color: Color4,
  size: { width: number; height: number; fontSize: number },
) {
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
  const mobile = isExplorerMobile()
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
        position: { left: '32%', top: '12%' },
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
