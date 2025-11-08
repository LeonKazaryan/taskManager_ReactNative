import React, { useMemo } from "react";
import { View, StyleSheet, FlatList, ScrollView, Alert } from "react-native";
import {
  Surface,
  Text,
  Button,
  Divider,
  Chip,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import { ActionLog, ActionType } from "../lib/types";

const getActionConfig = (actionType: ActionType) => {
  switch (actionType) {
    case "created":
      return {
        icon: "plus-circle",
        color: "#10b981",
        backgroundColor: "#d1fae5",
        label: "Created",
      };
    case "updated":
      return {
        icon: "pencil",
        color: "#6366f1",
        backgroundColor: "#eef2ff",
        label: "Updated",
      };
    case "deleted":
      return {
        icon: "delete",
        color: "#ef4444",
        backgroundColor: "#fee2e2",
        label: "Deleted",
      };
    case "status_changed":
      return {
        icon: "update",
        color: "#f59e0b",
        backgroundColor: "#fef3c7",
        label: "Status Changed",
      };
    default:
      return {
        icon: "information",
        color: "#6b7280",
        backgroundColor: "#f3f4f6",
        label: actionType,
      };
  }
};

const ActionLogItem = ({ log }: { log: ActionLog }) => {
  const router = useRouter();
  const { tasks } = useTaskStore();
  const config = getActionConfig(log.actionType);
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
    <Surface style={styles.logItem} elevation={1}>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
            <IconButton
              icon={config.icon}
              iconColor={config.color}
              size={20}
              style={styles.iconButton}
            />
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logTitleRow}>
              <Text variant="titleSmall" style={styles.logTitle} numberOfLines={1}>
                {log.taskTitle}
              </Text>
              <Chip
                style={[styles.actionChip, { backgroundColor: config.backgroundColor }]}
                textStyle={{ color: config.color, fontSize: 10, fontWeight: "600" }}
              >
                {config.label}
              </Chip>
            </View>
            {log.details && (
              <Text variant="bodySmall" style={styles.logDetails}>
                {log.details}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.logTime}>
              {formatTime(log.timestamp)} • {formatFullDate(log.timestamp)}
            </Text>
          </View>
        </View>
        {task && (
          <Button
            mode="text"
            compact
            onPress={() => router.push(`/task/${log.taskId}`)}
            textColor="#6366f1"
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
  return (
    <View style={styles.emptyContainer}>
      <Surface style={styles.emptyCard} elevation={1}>
        <View style={styles.emptyContent}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No History Yet
          </Text>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Your task actions will appear here
          </Text>
        </View>
      </Surface>
    </View>
  );
};

export default function HistoryScreen() {
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
      <View style={styles.container}>
        <Surface style={styles.header} elevation={2}>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              History
            </Text>
          </View>
        </Surface>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            History ({logs.length})
          </Text>
          <Button
            mode="text"
            onPress={handleClearHistory}
            textColor="#ef4444"
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
            <Text variant="titleMedium" style={styles.groupTitle}>
              {item.date}
            </Text>
            <Divider style={styles.groupDivider} />
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
    backgroundColor: "#fafafa",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    color: "#111827",
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
    color: "#111827",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupDivider: {
    marginBottom: 12,
    backgroundColor: "#e5e7eb",
  },
  logItem: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#ffffff",
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
    marginBottom: 4,
    gap: 8,
  },
  logTitle: {
    flex: 1,
    fontWeight: "600",
    color: "#111827",
  },
  actionChip: {
    height: 20,
  },
  logDetails: {
    color: "#6b7280",
    marginBottom: 4,
    fontSize: 12,
  },
  logTime: {
    color: "#9ca3af",
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
    backgroundColor: "#ffffff",
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
    color: "#111827",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    lineHeight: 24,
  },
});

