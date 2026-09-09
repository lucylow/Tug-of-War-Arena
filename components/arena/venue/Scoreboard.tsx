import { Rect, Text as SvgText } from "react-native-svg";

import { formatVenueScoreboard } from "@/lib/venue";

type ScoreboardProps = {
  crewLabel: string;
  opponentLabel: string;
  crewScore: number;
  opponentScore: number;
  teamColor: string;
  opponentColor: string;
};

export function Scoreboard({
  crewLabel,
  opponentLabel,
  crewScore,
  opponentScore,
  teamColor,
  opponentColor,
}: ScoreboardProps) {
  const board = formatVenueScoreboard({ crewLabel, opponentLabel, crewScore, opponentScore });

  return (
    <>
      <Rect x="118" y="30" width="124" height="22" rx="5" fill="#11142B" opacity={0.82} />
      <Rect x="118" y="30" width="124" height="22" rx="5" stroke="#FFC857" strokeWidth="1.2" fill="none" />
      <SvgText x="148" y="45" textAnchor="middle" fill={teamColor} fontSize="11" fontWeight="800">
        {board.crewText}
      </SvgText>
      <SvgText x="180" y="45" textAnchor="middle" fill="#FFC857" fontSize="8" fontWeight="800">
        {board.title}
      </SvgText>
      <SvgText x="212" y="45" textAnchor="middle" fill={opponentColor} fontSize="11" fontWeight="800">
        {board.opponentText}
      </SvgText>
    </>
  );
}
