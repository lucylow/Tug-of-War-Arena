import { Tabs } from "expo-router";

/**
 * In-app navigation lives on each screen. Hide the Expo tab bar so it does
 * not steal thumb space from Play Now / Pull.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none", height: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
    </Tabs>
  );
}
