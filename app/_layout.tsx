import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Tasks",
              headerStyle: { backgroundColor: "#6200ea" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="new"
            options={{
              title: "New Task",
              presentation: "modal",
              headerStyle: { backgroundColor: "#6200ea" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="task/[id]"
            options={{
              title: "Task Details",
              headerStyle: { backgroundColor: "#6200ea" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="edit/[id]"
            options={{
              title: "Edit Task",
              headerStyle: { backgroundColor: "#6200ea" },
              headerTintColor: "#fff",
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
