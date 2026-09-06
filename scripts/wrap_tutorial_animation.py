from pathlib import Path

path = Path("app/(tabs)/index.tsx")
source = path.read_text()
start = source.index("{showTutorial && <View accessibilityViewIsModal")
end = source.index("\n    </ScreenContainer>;")
block = source[start:end]
old_open = '<View style={styles.tutorialCard}>'
new_open = '<Animated.View style={[styles.tutorialCard, { opacity: tutorialOpacity, transform: [{ scale: tutorialScale }] }]>'
if block.count(old_open) != 1:
    raise SystemExit(f"expected one tutorial card opening, found {block.count(old_open)}")
block = block.replace(old_open, new_open, 1)
old_close = "</Pressable></View></View></View>}"
new_close = "</Pressable></View></Animated.View></View>}"
if not block.endswith(old_close):
    raise SystemExit("tutorial block closing anchor not found")
block = block[:-len(old_close)] + new_close
path.write_text(source[:start] + block + source[end:])
