import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useId } from "react";

import { WALLET_COLORS as C } from "@/components/wallet/palette";

type WalletMarkProps = {
  size?: number;
  connected?: boolean;
  live?: boolean;
};

export function WalletMark({ size = 28, connected = false, live = false }: WalletMarkProps) {
  const uid = useId().replace(/:/g, "");
  const accent = live ? C.fox : connected ? C.mint : C.gold;
  const glow = live ? C.gold : connected ? C.cyan : C.fog;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden>
      <Defs>
        <LinearGradient id={`walletMarkFace${uid}`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={accent} />
          <Stop offset="1" stopColor={glow} />
        </LinearGradient>
        <LinearGradient id={`walletMarkShine${uid}`} x1="10" y1="8" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={C.cloud} stopOpacity="0.55" />
          <Stop offset="1" stopColor={C.cloud} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Circle cx="16" cy="16" r="15" fill={C.ink} />
      <Circle cx="16" cy="16" r="13" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.4" />
      <Path
        d="M8 13.2 12.4 6.8h7.2L24 13.2l-2.2 9.2c-.3 1.4-1.6 2.4-3 2.4h-5.6c-1.4 0-2.7-1-3-2.4L8 13.2Z"
        fill={`url(#walletMarkFace${uid})`}
      />
      <Path d="M12.4 6.8 16 12.2 19.6 6.8" fill={C.ink} opacity="0.22" />
      <Path d="M8 13.2h16L16 18.6 8 13.2Z" fill={C.ink} opacity="0.28" />
      <Path d="M11.2 18.4 16 22.2l4.8-3.8" fill="none" stroke={C.ink} strokeWidth="1.2" strokeLinejoin="round" />
      <Path d="M10.8 9.4 16 14.2 21.2 9.4" fill="none" stroke={`url(#walletMarkShine${uid})`} strokeWidth="1.4" />
    </Svg>
  );
}
