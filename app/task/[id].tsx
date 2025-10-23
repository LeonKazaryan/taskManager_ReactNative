import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Card, Title, Paragraph, Button, Chip, Menu } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTaskStore } from "../../lib/store";
import { TaskStatus } from "../../lib/types";

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

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, deleteTask, setStatus } = useTaskStore();
  const [menuVisible, setMenuVisible] = React.useState(false);

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
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
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
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.title}>{task.title}</Title>
            <StatusChip status={task.status} />
          </View>

          {task.description && (
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Description</Title>
              <Paragraph style={styles.description}>
                {task.description}
              </Paragraph>
            </View>
          )}

          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Date & Time</Title>
            <Paragraph style={styles.info}>
              📅 {formatDateTime(task.datetime)}
            </Paragraph>
          </View>

          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Location</Title>
            <Paragraph style={styles.info}>📍 {task.location}</Paragraph>
          </View>

          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Created</Title>
            <Paragraph style={styles.info}>
              🕒 {formatDateTime(task.createdAt)}
            </Paragraph>
          </View>

          <View style={styles.actions}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={styles.actionButton}
                  icon="update"
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
            >
              Edit Task
            </Button>

            <Button
              mode="outlined"
              onPress={handleDelete}
              style={[styles.actionButton, styles.deleteButton]}
              icon="delete"
              textColor="#f44336"
            >
              Delete Task
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    color: "#6200ea",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  info: {
    fontSize: 14,
    color: "#666",
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  deleteButton: {
    borderColor: "#f44336",
  },
});
