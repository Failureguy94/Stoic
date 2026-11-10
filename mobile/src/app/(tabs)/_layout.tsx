import { Tabs } from "expo-router";
import { TabIcon, type TabIconName } from "@/components/TabIcon";
import { font, useTheme } from "@/theme";

const TABS: { name: string; title: string; icon: TabIconName }[] = [
  { name: "index", title: "Find fix", icon: "fix" },
  { name: "tools", title: "Compare", icon: "compare" },
  { name: "focus", title: "Focus", icon: "focus" },
  { name: "circle", title: "Circle", icon: "circle" },
  { name: "more", title: "More", icon: "more" },
];

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.brand,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line, borderTopWidth: 2, height: 68, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: font.xbold, fontSize: 12 },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <TabIcon name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
