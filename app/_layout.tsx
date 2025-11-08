import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useTaskStore } from "../lib/store";
import { useThemeStore } from "../lib/themeStore";
import { lightTheme, darkTheme } from "../lib/theme";
import { requestNotificationPermissions } from "../lib/notifications";

export default function RootLayout() {
  const { initializeNotifications } = useTaskStore();
  const { themeMode } = useThemeStore();
  const theme = themeMode === "dark" ? darkTheme : lightTheme;

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
            options={() => ({
              title: "Tasks",
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { fontWeight: "700" },
            })}
          />
          <Stack.Screen
            name="new"
            options={() => ({
              title: "New Task",
              presentation: "modal",
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { fontWeight: "700" },
            })}
          />
          <Stack.Screen
            name="task/[id]"
            options={() => ({
              title: "Task Details",
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { fontWeight: "700" },
            })}
          />
          <Stack.Screen
            name="edit/[id]"
            options={() => ({
              title: "Edit Task",
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { fontWeight: "700" },
            })}
          />
          <Stack.Screen
            name="map"
            options={() => ({
              title: "Map",
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { fontWeight: "700" },
            })}
          />
          <Stack.Screen
            name="history"
            options={() => ({
              title: "History",
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { fontWeight: "700" },
            })}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
