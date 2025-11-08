import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { useTaskStore } from "../lib/store";
import { useThemeStore } from "../lib/themeStore";
import { lightTheme, darkTheme } from "../lib/theme";
import { requestNotificationPermissions } from "../lib/notifications";
import NetInfo from "@react-native-community/netinfo";

export default function RootLayout() {
  const { initializeNotifications, syncTasks } = useTaskStore();
  const { themeMode } = useThemeStore();
  const theme = themeMode === "dark" ? darkTheme : lightTheme;
  const wasOfflineRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Request notification permissions and initialize notifications on app start
    const initNotifications = async () => {
      await requestNotificationPermissions();
      await initializeNotifications();
    };
    initNotifications();
  }, [initializeNotifications]);

  useEffect(() => {
    // Проверяем начальное состояние сети и синхронизируем если есть pending операции
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected ?? false;
      wasOfflineRef.current = !isConnected;

      // Если при старте есть интернет и есть pending операции, пытаемся синхронизировать
      if (isConnected) {
        const { pendingSync } = useTaskStore.getState();
        if (pendingSync.length > 0) {
          console.log("App started with internet, syncing pending tasks...");
          syncTasks().catch((error) => {
            console.error("Failed to sync tasks on app start:", error);
          });
        }
      }
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;

      // Если соединение восстановилось (было offline, стало online)
      if (isConnected && wasOfflineRef.current === true) {
        console.log("Network connection restored, syncing tasks...");
        syncTasks().catch((error) => {
          console.error(
            "Failed to sync tasks after connection restore:",
            error
          );
        });
      }

      // Сохраняем текущее состояние для следующей проверки
      wasOfflineRef.current = !isConnected;
    });

    return () => {
      unsubscribe();
    };
  }, [syncTasks]);

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
