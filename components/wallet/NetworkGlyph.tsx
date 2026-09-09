import Svg, { Circle, Path, Polygon } from "react-native-svg";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { hideFromA11y } from "@/lib/a11y";

type NetworkGlyphProps = {
  chainId: number | null;
  size?: number;
};

export function NetworkGlyph({ chainId, size = 18 }: NetworkGlyphProps) {
  if (chainId === 1) {
    return (
      <Svg width={size} height={size} viewBox="0 0 18 18" {...hideFromA11y()}>
        <Circle cx="9" cy="9" r="8.2" fill={C.ink} stroke={C.ethereum} strokeWidth="1.2" />
        <Polygon points="9,2.8 13.2,9 9,11.1 4.8,9" fill={C.ethereum} />
        <Polygon points="9,15.4 13.2,9.6 9,11.7 4.8,9.6" fill={C.ethereum} opacity="0.7" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" {...hideFromA11y()}>
      <Circle cx="9" cy="9" r="8.2" fill={C.ink} stroke={chainId === 80002 ? C.cyan : C.polygon} strokeWidth="1.2" />
      <Path
        d="M9 3.4 13.8 6.2v5.6L9 14.6 4.2 11.8V6.2L9 3.4Z"
        fill={chainId === 80002 ? C.cyan : C.polygon}
        opacity="0.92"
      />
      <Path d="M9 6.2 11.7 7.8v3.2L9 12.6 6.3 11V7.8L9 6.2Z" fill={C.ink} opacity="0.35" />
    </Svg>
  );
}
