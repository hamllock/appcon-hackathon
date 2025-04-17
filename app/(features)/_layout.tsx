import { Stack } from "expo-router";

export default function FeaturesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="news-verify"
        options={{
          headerTitle: "News Verifications",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="text-reader"
        options={{
          headerTitle: "Text Reader",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="wound-classify"
        options={{
          headerTitle: "Wound Classification",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="object-identify"
        options={{
          headerTitle: "Object Identification",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
