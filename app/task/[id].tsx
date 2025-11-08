import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
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
  List,
  IconButton,
  useTheme,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTaskStore } from "../../lib/store";
import { useThemeStore } from "../../lib/themeStore";
import { lightStatusColors, darkStatusColors } from "../../lib/theme";
import { TaskStatus } from "../../lib/types";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

const StatusChip = ({ status }: { status: TaskStatus }) => {
  const { themeMode } = useThemeStore();
  const statusColors =
    themeMode === "dark" ? darkStatusColors : lightStatusColors;
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

  const label = labels[status] || status;

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
      {label}
    </Chip>
  );
};

export default function TaskDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, deleteTask, setStatus } = useTaskStore();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuKey, setMenuKey] = React.useState(0);
  const [imageModalVisible, setImageModalVisible] = React.useState(false);
  const [selectedImageUri, setSelectedImageUri] = React.useState<string | null>(
    null
  );

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

  const handleOpenFile = async (attachment: {
    uri: string;
    name: string;
    type: string;
  }) => {
    try {
      // For images, show in modal
      if (attachment.type.startsWith("image/")) {
        setSelectedImageUri(attachment.uri);
        setImageModalVisible(true);
        return;
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(attachment.uri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "File not found");
        return;
      }

      // On Android, try to use IntentLauncher with content URI
      if (Platform.OS === "android") {
        try {
          // Try to get content URI (works if file is in app's cache/document directory)
          let contentUri = attachment.uri;

          // If file is in cache directory, try to get content URI
          if (
            attachment.uri.includes("cache") ||
            attachment.uri.includes("document")
          ) {
            try {
              // @ts-ignore - getContentUriAsync might not be in types but exists in runtime
              contentUri = await FileSystem.getContentUriAsync(attachment.uri);
            } catch (e) {
              // If getContentUriAsync doesn't exist, use original URI
              console.log(
                "getContentUriAsync not available, using original URI"
              );
            }
          }

          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
              type: attachment.type,
            }
          );
          return;
        } catch (intentError) {
          console.log("IntentLauncher failed, trying Sharing:", intentError);
          // Fall through to Sharing
        }
      }

      // Use Sharing API (works on both platforms, shows "Open with" dialog)
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(attachment.uri, {
          mimeType: attachment.type,
          dialogTitle: `Open ${attachment.name}`,
          UTI: attachment.type, // iOS specific
        });
      } else {
        // else try to open with Linking
        const canOpen = await Linking.canOpenURL(attachment.uri);
        if (canOpen) {
          await Linking.openURL(attachment.uri);
        } else {
          Alert.alert("Error", "Cannot open this file type on this device");
        }
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert(
        "Error",
        `Could not open file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Surface
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={1}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              variant="headlineSmall"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              {task.title}
            </Text>
            <StatusChip status={task.status} />
          </View>

          {task.description && (
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Description
              </Text>
              <Text
                variant="bodyLarge"
                style={[
                  styles.description,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {task.description}
              </Text>
            </View>
          )}

          <Divider style={{ backgroundColor: theme.colors.outline }} />

          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Due Date & Time
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.info, { color: theme.colors.onSurface }]}
            >
              {formatDateTime(task.datetime)}
            </Text>
          </View>

          <Divider style={{ backgroundColor: theme.colors.outline }} />

          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Location
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.info, { color: theme.colors.onSurface }]}
            >
              {task.location}
            </Text>
          </View>

          <Divider style={{ backgroundColor: theme.colors.outline }} />

          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Created
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.info, { color: theme.colors.onSurface }]}
            >
              {formatDateTime(task.createdAt)}
            </Text>
          </View>

          {task.attachments && task.attachments.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Attachments ({task.attachments.length})
                </Text>
                {task.attachments.map((attachment, index) => (
                  <List.Item
                    key={index}
                    title={attachment.name}
                    description={attachment.type}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          attachment.type.startsWith("image/")
                            ? "image"
                            : "file"
                        }
                        color={theme.colors.primary}
                      />
                    )}
                    right={(props) => (
                      <Button
                        {...props}
                        mode="text"
                        compact
                        onPress={() => handleOpenFile(attachment)}
                        icon={
                          attachment.type.startsWith("image/")
                            ? "eye"
                            : "open-in-new"
                        }
                        textColor={theme.colors.primary}
                      >
                        {attachment.type.startsWith("image/") ? "View" : "Open"}
                      </Button>
                    )}
                    style={[
                      styles.attachmentItem,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  />
                ))}
              </View>
            </>
          )}

          <View style={styles.actions}>
            <Menu
              key={menuKey}
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={[
                    styles.actionButton,
                    { borderColor: theme.colors.primary },
                  ]}
                  icon="update"
                  textColor={theme.colors.primary}
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
              style={[
                styles.actionButton,
                { borderColor: theme.colors.primary },
              ]}
              icon="pencil"
              textColor={theme.colors.primary}
            >
              Edit Task
            </Button>

            <Button
              mode="outlined"
              onPress={handleDelete}
              style={[
                styles.actionButton,
                styles.deleteButton,
                { borderColor: theme.colors.error },
              ]}
              icon="delete"
              textColor={theme.colors.error}
            >
              Delete Task
            </Button>
          </View>
        </View>
      </Surface>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.imageModalContainer}>
          <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
            <View style={styles.imageModalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.imageModalContent}>
            {selectedImageUri && (
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.closeButtonContainer} pointerEvents="box-none">
              <IconButton
                icon="close"
                iconColor="#ffffff"
                size={32}
                onPress={() => setImageModalVisible(false)}
                style={styles.closeIconButton}
                containerColor="rgba(0, 0, 0, 0.7)"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 16,
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
    lineHeight: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    lineHeight: 24,
  },
  info: {
    fontWeight: "500",
    lineHeight: 24,
  },
  divider: {
    marginVertical: 16,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
  },
  deleteButton: {
    // borderColor will be set dynamically
  },
  attachmentItem: {
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 5,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageModalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  closeButtonContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
    elevation: 10, // Android shadow
    pointerEvents: "box-none",
  },
  closeIconButton: {
    margin: 0,
  },
});
