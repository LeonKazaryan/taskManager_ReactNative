import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import {
  FAB,
  Card,
  Title,
  Paragraph,
  Chip,
  Menu,
  Button,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import { Task, TaskStatus } from "../lib/types";

const StatusChip = ({ status }: { status: TaskStatus }) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return "#ff9800";
      case "in_progress":
        return "#2196f3";
      case "completed":
        return "#4caf50";
      case "cancelled":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <Chip
      style={{ backgroundColor: getStatusColor(status) }}
      textStyle={{ color: "white" }}
    >
      {getStatusLabel(status)}
    </Chip>
  );
};

const TaskCard = ({ task }: { task: Task }) => {
  const router = useRouter();
  const { setStatus } = useTaskStore();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(task.id, newStatus);
    setMenuVisible(false);
  };

  return (
    <Card style={styles.card} onPress={() => router.push(`/task/${task.id}`)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title numberOfLines={2}>{task.title}</Title>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setMenuVisible(true)}
              >
                Status
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
          <Paragraph numberOfLines={2} style={styles.description}>
            {task.description}
          </Paragraph>
        )}

        <View style={styles.cardFooter}>
          <Paragraph style={styles.datetime}>
            📅 {formatDateTime(task.datetime)}
          </Paragraph>
          <Paragraph style={styles.location}>📍 {task.location}</Paragraph>
        </View>

        <View style={styles.statusContainer}>
          <StatusChip status={task.status} />
        </View>
      </Card.Content>
    </Card>
  );
};

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Title style={styles.emptyTitle}>No tasks yet</Title>
    <Paragraph style={styles.emptyText}>
      Create your first task to get started!
    </Paragraph>
  </View>
);

export default function TaskListScreen() {
  const router = useRouter();
  const { getSortedTasks, setSortOrder, sortOrder } = useTaskStore();
  const tasks = getSortedTasks();
  const [sortMenuVisible, setSortMenuVisible] = React.useState(false);

  const sortOptions = [
    { key: "dateAdded_desc", label: "Date Added (New → Old)" },
    { key: "dateAdded_asc", label: "Date Added (Old → New)" },
    { key: "status", label: "Status (Grouped)" },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.key === sortOrder)?.label || "Sort";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSortMenuVisible(true)}
              icon="sort"
            >
              {currentSortLabel}
            </Button>
          }
        >
          {sortOptions.map((option) => (
            <Menu.Item
              key={option.key}
              onPress={() => {
                setSortOrder(option.key as any);
                setSortMenuVisible(false);
              }}
              title={option.label}
            />
          ))}
        </Menu>
      </View>

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TaskCard task={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push("/new")}
        label="Add Task"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  description: {
    marginBottom: 8,
    color: "#666",
  },
  cardFooter: {
    marginBottom: 8,
  },
  datetime: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: "#666",
  },
  statusContainer: {
    alignItems: "flex-start",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#6200ea",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
  },
});
