import React from "react";
import { View, FlatList, StyleSheet, ScrollView } from "react-native";
import {
  FAB,
  Card,
  Title,
  Paragraph,
  Chip,
  Menu,
  Button,
  Text,
  Surface,
  Divider,
  Switch,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import { useThemeStore } from "../lib/themeStore";
import { lightStatusColors, darkStatusColors } from "../lib/theme";
import { Task, TaskStatus } from "../lib/types";

const StatusChip = ({ status }: { status: TaskStatus }) => {
  const { themeMode } = useThemeStore();
  const statusColors =
    themeMode === "dark" ? darkStatusColors : lightStatusColors;

  const getStatusConfig = (status: TaskStatus) => {
    const config = statusColors[status] || {
      color: themeMode === "dark" ? "#9ca3af" : "#6b7280",
      backgroundColor: themeMode === "dark" ? "#374151" : "#f3f4f6",
    };

    const labels: Record<TaskStatus, string> = {
      todo: "To Do",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return {
      ...config,
      label: labels[status] || status,
    };
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      style={{
        backgroundColor: config.backgroundColor,
        borderWidth: 1,
        borderColor: config.color,
      }}
      textStyle={{
        color: config.color,
        fontWeight: "600",
        fontSize: 12,
      }}
    >
      {config.label}
    </Chip>
  );
};

const TaskCard = ({ task }: { task: Task }) => {
  const router = useRouter();
  const theme = useTheme();
  const { setStatus } = useTaskStore();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuKey, setMenuKey] = React.useState(0);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(task.id, newStatus);
    setMenuVisible(false);
    // Force menu re-render
    setMenuKey((prev) => prev + 1);
  };

  return (
    <Surface
      style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <Card
        style={styles.card}
        onPress={() => router.push(`/task/${task.id}`)}
        mode="outlined"
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text
                variant="titleMedium"
                style={[styles.taskTitle, { color: theme.colors.onSurface }]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <StatusChip status={task.status} />
            </View>

            <Menu
              key={menuKey}
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="text"
                  compact
                  onPress={() => setMenuVisible(true)}
                  icon="chevron-down"
                  textColor={theme.colors.onSurfaceVariant}
                >
                  Change
                </Button>
              }
            >
              <Menu.Item
                onPress={() => handleStatusChange("todo")}
                title="Set To Do"
              />
              <Menu.Item
                onPress={() => handleStatusChange("in_progress")}
                title="Set In Progress"
              />
              <Menu.Item
                onPress={() => handleStatusChange("completed")}
                title="Mark Completed"
              />
              <Menu.Item
                onPress={() => handleStatusChange("cancelled")}
                title="Mark Cancelled"
              />
            </Menu>
          </View>

          {task.description && (
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                { color: theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Text
                variant="bodySmall"
                style={[
                  styles.metaLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Due
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.metaValue, { color: theme.colors.onSurface }]}
              >
                {formatDateTime(task.datetime)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text
                variant="bodySmall"
                style={[
                  styles.metaLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Location
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.metaValue, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {task.location}
              </Text>
            </View>
          </View>
          {task.attachments && task.attachments.length > 0 && (
            <View
              style={[
                styles.attachmentsBadge,
                { borderTopColor: theme.colors.outline },
              ]}
            >
              <Text
                variant="bodySmall"
                style={[
                  styles.attachmentsText,
                  { color: theme.colors.primary },
                ]}
              >
                📎 {task.attachments.length} attachment
                {task.attachments.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </Surface>
  );
};

const EmptyState = () => {
  const router = useRouter();
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
            No tasks yet
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            Create your first task to get started
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push("/new")}
            style={[
              styles.emptyButton,
              { backgroundColor: theme.colors.primary },
            ]}
            icon="plus"
          >
            Create Task
          </Button>
        </View>
      </Surface>
    </View>
  );
};

export default function TaskListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    getSortedTasks,
    setSortOrder,
    sortOrder,
    pendingSync,
    syncStatus,
    syncTasks,
  } = useTaskStore();
  const { themeMode, toggleTheme } = useThemeStore();
  const tasks = getSortedTasks();
  const [sortMenuVisible, setSortMenuVisible] = React.useState(false);
  const [menuKey, setMenuKey] = React.useState(0);

  const sortOptions = [
    { key: "dateAdded_desc", label: "Newest First" },
    { key: "dateAdded_asc", label: "Oldest First" },
    { key: "status", label: "By Status" },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.key === sortOrder)?.label || "Sort";

  const handleSortChange = (optionKey: string) => {
    setSortOrder(optionKey as any);
    setSortMenuVisible(false);
    // Force menu re-render
    setMenuKey((prev) => prev + 1);
  };

  const openSortMenu = () => {
    setSortMenuVisible(true);
  };

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
        {/* Sync Status Indicator */}
        {pendingSync.length > 0 && (
          <View
            style={[
              styles.syncIndicator,
              {
                backgroundColor:
                  syncStatus === "syncing"
                    ? theme.colors.primaryContainer
                    : syncStatus === "error"
                    ? theme.colors.errorContainer
                    : theme.colors.surfaceVariant,
              },
            ]}
          >
            <View style={styles.syncIndicatorContent}>
              <Text
                style={[
                  styles.syncText,
                  {
                    color:
                      syncStatus === "syncing"
                        ? theme.colors.onPrimaryContainer
                        : syncStatus === "error"
                        ? theme.colors.onErrorContainer
                        : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {syncStatus === "syncing"
                  ? `Syncing ${pendingSync.length} task(s)...`
                  : syncStatus === "error"
                  ? `Sync failed (${pendingSync.length} pending)`
                  : `${pendingSync.length} task(s) pending sync`}
              </Text>
              {syncStatus !== "syncing" && (
                <Button
                  mode="text"
                  compact
                  onPress={() => {
                    console.log("Manual sync triggered");
                    syncTasks().catch((error) => {
                      console.error("Manual sync failed:", error);
                    });
                  }}
                  textColor={
                    syncStatus === "error"
                      ? theme.colors.onErrorContainer
                      : theme.colors.onSurfaceVariant
                  }
                  style={styles.syncButton}
                >
                  Retry
                </Button>
              )}
            </View>
          </View>
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerActions}>
            <Button
              mode="outlined"
              onPress={() => router.push("/history")}
              icon="history"
              style={[styles.mapButton, { borderColor: theme.colors.primary }]}
              textColor={theme.colors.primary}
              compact
            >
              History
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push("/map")}
              icon="map"
              style={[styles.mapButton, { borderColor: theme.colors.primary }]}
              textColor={theme.colors.primary}
              compact
            >
              Map
            </Button>
            <Menu
              key={menuKey}
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={openSortMenu}
                  icon="sort"
                  style={[
                    styles.sortButton,
                    { borderColor: theme.colors.primary },
                  ]}
                  textColor={theme.colors.primary}
                >
                  {currentSortLabel}
                </Button>
              }
            >
              {sortOptions.map((option) => (
                <Menu.Item
                  key={option.key}
                  onPress={() => handleSortChange(option.key)}
                  title={option.label}
                />
              ))}
            </Menu>
            <View style={styles.themeToggle}>
              <Switch
                value={themeMode === "dark"}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </View>
      </Surface>

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TaskCard task={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          <FAB
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            icon="plus"
            onPress={() => router.push("/new")}
            label="New Task"
            size="large"
          />
        </>
      )}
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  mapButton: {
    // borderColor will be set dynamically
  },
  sortButton: {
    // borderColor will be set dynamically
    alignSelf: "flex-end",
  },
  themeToggle: {
    marginLeft: 8,
  },
  syncIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  syncIndicatorContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  syncButton: {
    marginLeft: 8,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 12,
    borderRadius: 12,
    // backgroundColor will be set dynamically
  },
  card: {
    backgroundColor: "transparent",
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginRight: 12,
    fontWeight: "600",
    lineHeight: 22,
    // color will be set dynamically
  },
  description: {
    lineHeight: 20,
    marginBottom: 16,
    // color will be set dynamically
  },
  taskMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaItem: {
    flex: 1,
    marginRight: 16,
  },
  metaLabel: {
    fontWeight: "500",
    marginBottom: 2,
    // color will be set dynamically
  },
  metaValue: {
    fontWeight: "500",
    // color will be set dynamically
  },
  attachmentsBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    // borderTopColor will be set dynamically
  },
  attachmentsText: {
    fontWeight: "500",
    // color will be set dynamically
  },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    // backgroundColor will be set dynamically
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    // backgroundColor will be set dynamically
  },
  emptyCard: {
    borderRadius: 16,
    width: "75%",
    maxWidth: 320,
    // backgroundColor will be set dynamically
  },
  emptyContent: {
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "700",
    // color will be set dynamically
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
    // color will be set dynamically
  },
  emptyButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    // backgroundColor will be set dynamically
  },
});
