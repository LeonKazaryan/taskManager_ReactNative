import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Menu,
  Surface,
  Text,
  Divider,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTaskStore } from "../../lib/store";
import { TaskStatus } from "../../lib/types";

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
        fontSize: 14,
      }}
    >
      {config.label}
    </Chip>
  );
};

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, deleteTask, setStatus } = useTaskStore();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuKey, setMenuKey] = React.useState(0);

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Task not found</Title>
            <Button onPress={() => router.back()}>Go Back</Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(task.id, newStatus);
    setMenuVisible(false);
    // Force menu re-render
    setMenuKey((prev) => prev + 1);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              {task.title}
            </Text>
            <StatusChip status={task.status} />
          </View>

          {task.description && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Description
              </Text>
              <Text variant="bodyLarge" style={styles.description}>
                {task.description}
              </Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Due Date & Time
            </Text>
            <Text variant="bodyLarge" style={styles.info}>
              {formatDateTime(task.datetime)}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location
            </Text>
            <Text variant="bodyLarge" style={styles.info}>
              {task.location}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Created
            </Text>
            <Text variant="bodyLarge" style={styles.info}>
              {formatDateTime(task.createdAt)}
            </Text>
          </View>

          <View style={styles.actions}>
            <Menu
              key={menuKey}
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={styles.actionButton}
                  icon="update"
                  textColor="#6366f1"
                >
                  Change Status
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

            <Button
              mode="outlined"
              onPress={() => router.push(`/edit/${task.id}`)}
              style={styles.actionButton}
              icon="pencil"
              textColor="#6366f1"
            >
              Edit Task
            </Button>

            <Button
              mode="outlined"
              onPress={handleDelete}
              style={[styles.actionButton, styles.deleteButton]}
              icon="delete"
              textColor="#ef4444"
            >
              Delete Task
            </Button>
          </View>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  card: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    flex: 1,
    marginRight: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  description: {
    color: "#6b7280",
    lineHeight: 24,
  },
  info: {
    color: "#111827",
    fontWeight: "500",
    lineHeight: 24,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: "#e5e7eb",
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    borderColor: "#6366f1",
  },
  deleteButton: {
    borderColor: "#ef4444",
  },
});
