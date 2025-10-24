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
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import { Task, TaskStatus } from "../lib/types";

const StatusChip = ({ status }: { status: TaskStatus }) => {
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return {
          color: "#6366f1",
          backgroundColor: "#eef2ff",
          label: "To Do",
        };
      case "in_progress":
        return {
          color: "#f59e0b",
          backgroundColor: "#fef3c7",
          label: "In Progress",
        };
      case "completed":
        return {
          color: "#10b981",
          backgroundColor: "#d1fae5",
          label: "Completed",
        };
      case "cancelled":
        return {
          color: "#ef4444",
          backgroundColor: "#fee2e2",
          label: "Cancelled",
        };
      default:
        return {
          color: "#6b7280",
          backgroundColor: "#f3f4f6",
          label: status,
        };
    }
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
    <Surface style={styles.taskCard} elevation={1}>
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
                style={styles.taskTitle}
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
                  textColor="#6b7280"
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
              style={styles.description}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Text variant="bodySmall" style={styles.metaLabel}>
                Due
              </Text>
              <Text variant="bodySmall" style={styles.metaValue}>
                {formatDateTime(task.datetime)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text variant="bodySmall" style={styles.metaLabel}>
                Location
              </Text>
              <Text
                variant="bodySmall"
                style={styles.metaValue}
                numberOfLines={1}
              >
                {task.location}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Surface>
  );
};

const EmptyState = () => {
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Surface style={styles.emptyCard} elevation={1}>
        <View style={styles.emptyContent}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No tasks yet
          </Text>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Create your first task to get started
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push("/new")}
            style={styles.emptyButton}
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
  const { getSortedTasks, setSortOrder, sortOrder } = useTaskStore();
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
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Tasks
          </Text>
          <Menu
            key={menuKey}
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={openSortMenu}
                icon="sort"
                style={styles.sortButton}
                textColor="#6366f1"
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
            style={styles.fab}
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
  sortButton: {
    borderColor: "#6366f1",
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
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
    color: "#111827",
    lineHeight: 22,
  },
  description: {
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
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
    color: "#9ca3af",
    fontWeight: "500",
    marginBottom: 2,
  },
  metaValue: {
    color: "#374151",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: "#6366f1",
    borderRadius: 16,
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
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingHorizontal: 24,
  },
});
