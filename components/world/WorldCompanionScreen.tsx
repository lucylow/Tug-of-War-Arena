import { WorldEntryCard } from "@/components/world/WorldEntryCard";
import { useHybridWorld } from "@/hooks/use-hybrid-world";

type Props = {
  onEnterWorld?: () => void | Promise<void>;
};

export function WorldCompanionScreen({ onEnterWorld }: Props) {
  const hybrid = useHybridWorld();
  return <WorldEntryCard onEnterWorld={onEnterWorld} hybrid={hybrid} />;
}
