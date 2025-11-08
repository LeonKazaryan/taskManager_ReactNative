import { Stack } from "expo-router";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useTaskStore } from "../lib/store";
import { requestNotificationPermissions } from "../lib/notifications";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#6366f1",
    primaryContainer: "#eef2ff",
    secondary: "#f59e0b",
    secondaryContainer: "#fef3c7",
    surface: "#ffffff",
    surfaceVariant: "#f8fafc",
    background: "#fafafa",
    error: "#ef4444",
    onSurface: "#111827",
    onSurfaceVariant: "#6b7280",
    outline: "#e5e7eb",
  },
};

export default function RootLayout() {
  const { initializeNotifications } = useTaskStore();

  useEffect(() => {
    // Request notification permissions and initialize notifications on app start
    const initNotifications = async () => {
      await requestNotificationPermissions();
      await initializeNotifications();
    };
    initNotifications();
  }, [initializeNotifications]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Tasks",
              headerStyle: { backgroundColor: "#ffffff" },
              headerTintColor: "#111827",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
          <Stack.Screen
            name="new"
            options={{
              title: "New Task",
              presentation: "modal",
              headerStyle: { backgroundColor: "#ffffff" },
              headerTintColor: "#111827",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
          <Stack.Screen
            name="task/[id]"
            options={{
              title: "Task Details",
              headerStyle: { backgroundColor: "#ffffff" },
              headerTintColor: "#111827",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
          <Stack.Screen
            name="edit/[id]"
            options={{
              title: "Edit Task",
              headerStyle: { backgroundColor: "#ffffff" },
              headerTintColor: "#111827",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
          <Stack.Screen
            name="map"
            options={{
              title: "Map",
              headerStyle: { backgroundColor: "#ffffff" },
              headerTintColor: "#111827",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
          <Stack.Screen
            name="history"
            options={{
              title: "History",
              headerStyle: { backgroundColor: "#ffffff" },
              headerTintColor: "#111827",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
