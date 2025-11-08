import React, { useMemo } from "react";
import { View, StyleSheet, FlatList, ScrollView, Alert } from "react-native";
import {
  Surface,
  Text,
  Button,
  Divider,
  Chip,
  IconButton,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import { useThemeStore } from "../lib/themeStore";
import { lightStatusColors, darkStatusColors } from "../lib/theme";
import { ActionLog, ActionType } from "../lib/types";

const getActionConfig = (
  actionType: ActionType,
  themeMode: "light" | "dark"
) => {
  const statusColors =
    themeMode === "dark" ? darkStatusColors : lightStatusColors;
  switch (actionType) {
    case "created":
      return {
        icon: "plus-circle",
        color: statusColors.completed.color,
        backgroundColor: statusColors.completed.backgroundColor,
        label: "Created",
      };
    case "updated":
      return {
        icon: "pencil",
        color: statusColors.todo.color,
        backgroundColor: statusColors.todo.backgroundColor,
        label: "Updated",
      };
    case "deleted":
      return {
        icon: "delete",
        color: statusColors.cancelled.color,
        backgroundColor: statusColors.cancelled.backgroundColor,
        label: "Deleted",
      };
    case "status_changed":
      return {
        icon: "update",
        color: statusColors.in_progress.color,
        backgroundColor: statusColors.in_progress.backgroundColor,
        label: "Status Changed",
      };
    default:
      return {
        icon: "information",
        color: themeMode === "dark" ? "#9ca3af" : "#6b7280",
        backgroundColor: themeMode === "dark" ? "#374151" : "#f3f4f6",
        label: actionType,
      };
  }
};

const ActionLogItem = ({ log }: { log: ActionLog }) => {
  const router = useRouter();
  const theme = useTheme();
  const { themeMode } = useThemeStore();
  const { tasks } = useTaskStore();
  const config = getActionConfig(log.actionType, themeMode);
  const task = tasks.find((t) => t.id === log.taskId);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Surface
      style={[styles.logItem, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: config.backgroundColor },
            ]}
          >
            <IconButton
              icon={config.icon}
              iconColor={config.color}
              size={20}
              style={styles.iconButton}
            />
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logTitleRow}>
              <Text
                variant="titleSmall"
                style={[styles.logTitle, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {log.taskTitle}
              </Text>
              <Chip
                mode="flat"
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: config.backgroundColor,
                    borderWidth: 1,
                    borderColor: config.color,
                  },
                ]}
                textStyle={{
                  color: config.color,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                {config.label}
              </Chip>
            </View>
            {log.details && (
              <Text
                variant="bodySmall"
                style={[
                  styles.logDetails,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {log.details}
              </Text>
            )}
            <Text
              variant="bodySmall"
              style={[styles.logTime, { color: theme.colors.onSurfaceVariant }]}
            >
              {formatTime(log.timestamp)} • {formatFullDate(log.timestamp)}
            </Text>
          </View>
        </View>
        {task && (
          <Button
            mode="text"
            compact
            onPress={() => router.push(`/task/${log.taskId}`)}
            textColor={theme.colors.primary}
            icon="arrow-right"
            style={styles.viewButton}
          >
            View Task
          </Button>
        )}
      </View>
    </Surface>
  );
};

const EmptyState = () => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.emptyContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Surface
        style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}
        elevation={1}
      >
        <View style={styles.emptyContent}>
          <Text
            variant="headlineSmall"
            style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
          >
            No History Yet
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            Your task actions will appear here
          </Text>
        </View>
      </Surface>
    </View>
  );
};

export default function HistoryScreen() {
  const theme = useTheme();
  const { getActionLogs, clearActionLogs } = useTaskStore();
  const logs = getActionLogs();

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: ActionLog[] } = {};

    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      const group = groups[groupKey];
      if (group) {
        group.push(log);
      }
    });

    return Object.entries(groups).map(([date, logs]) => ({
      date,
      logs,
    }));
  }, [logs]);

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all action history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearActionLogs(),
        },
      ]
    );
  };

  if (logs.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Surface
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outline,
            },
          ]}
          elevation={2}
        >
          <View style={styles.headerContent}>
            <Text
              variant="headlineSmall"
              style={[styles.headerTitle, { color: theme.colors.onSurface }]}
            >
              History
            </Text>
          </View>
        </Surface>
        <EmptyState />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outline,
          },
        ]}
        elevation={2}
      >
        <View style={styles.headerContent}>
          <Text
            variant="headlineSmall"
            style={[styles.headerTitle, { color: theme.colors.onSurface }]}
          >
            History ({logs.length})
          </Text>
          <Button
            mode="text"
            onPress={handleClearHistory}
            textColor={theme.colors.error}
            icon="delete-sweep"
            compact
          >
            Clear
          </Button>
        </View>
      </Surface>

      <FlatList
        data={groupedLogs}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={styles.groupContainer}>
            <Text
              variant="titleMedium"
              style={[styles.groupTitle, { color: theme.colors.onSurface }]}
            >
              {item.date}
            </Text>
            <Divider style={{ backgroundColor: theme.colors.outline }} />
            {item.logs.map((log) => (
              <ActionLogItem key={log.id} log={log} />
            ))}
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontWeight: "700",
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontWeight: "700",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupDivider: {
    marginBottom: 12,
  },
  logItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  logContent: {
    padding: 16,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconButton: {
    margin: 0,
  },
  logInfo: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 8,
  },
  logTitle: {
    flex: 1,
    fontWeight: "600",
  },
  actionChip: {
    minHeight: 24,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logDetails: {
    marginBottom: 4,
    fontSize: 12,
  },
  logTime: {
    fontSize: 11,
  },
  viewButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  emptyCard: {
    borderRadius: 16,
    width: "75%",
    maxWidth: 320,
  },
  emptyContent: {
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 24,
  },
});
