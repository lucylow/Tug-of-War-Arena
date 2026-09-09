import { Circle, G, Path, Rect } from "react-native-svg";

export function DummyProp({ x = 180, y = 150 }: { x?: number; y?: number }) {
  return (
    <G>
      <Rect x={x - 6} y={y - 2} width={12} height={4} rx={1} fill="#4A4034" />
      <Rect x={x - 3.2} y={y - 22} width={6.4} height={20} rx={2} fill="#C6B089" />
      <Circle cx={x} cy={y - 26} r={4.2} fill="#E8C9A8" />
      <Path d={`M${x - 9} ${y - 18} L ${x - 3} ${y - 16}`} stroke="#8D7A58" strokeWidth="2" />
      <Path d={`M${x + 9} ${y - 18} L ${x + 3} ${y - 16}`} stroke="#8D7A58" strokeWidth="2" />
    </G>
  );
}
