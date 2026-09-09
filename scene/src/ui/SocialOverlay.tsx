import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { gold, midnight, withAlpha } from '../palette'
import { getSocialOverlayLayout } from '../logic/socialLayout'

export function SocialOverlay(): ReactEcs.JSX.Element {
  const mobile = isMobile()
  const layout = getSocialOverlayLayout(mobile)

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { left: `${layout.leftPercent}%`, top: `${layout.topPercent}%` },
        width: layout.width,
        height: layout.height,
      }}
      uiBackground={{ color: withAlpha(midnight, 0.92) }}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: '100%' }}
        uiText={{ value: layout.label, fontSize: layout.fontSize, color: gold, textAlign: 'middle-center' }}
      />
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { right: -2, top: -2 },
          width: 10,
          height: 10,
        }}
        uiBackground={{ color: Color4.create(0.447, 0.949, 0.714, 1) }}
      />
    </UiEntity>
  )
}
