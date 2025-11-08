import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Task } from "./types";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("task-reminders", {
        name: "Task Reminders",
        description: "Notifications for task due dates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6366f1",
      });
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

/**
 * Schedule a notification 30 minutes before task due date
 */
export async function scheduleTaskNotification(task: Task): Promise<string | null> {
  try {
    // Don't schedule notifications for completed or cancelled tasks
    if (task.status === "completed" || task.status === "cancelled") {
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const dueDate = new Date(task.datetime);
    const now = new Date();
    
    // Calculate notification time (30 minutes before due date)
    const notificationTime = new Date(dueDate.getTime() - 30 * 60 * 1000);

    // Don't schedule if notification time is in the past
    if (notificationTime <= now) {
      console.log(`Task ${task.id} due date is too soon, skipping notification`);
      return null;
    }

    // Cancel any existing notification for this task
    await cancelTaskNotification(task.id);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `"${task.title}" is due in 30 minutes`,
        data: { taskId: task.id },
        sound: true,
      },
      trigger: notificationTime,
    });

    console.log(`Scheduled notification for task ${task.id} at ${notificationTime.toISOString()}`);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

/**
 * Cancel notification for a task
 */
export async function cancelTaskNotification(taskId: string): Promise<void> {
  try {
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Find and cancel notification for this task
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.taskId === taskId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`Cancelled notification for task ${taskId}`);
      }
    }
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
}

/**
 * Cancel all task notifications
 */
export async function cancelAllTaskNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Cancelled all task notifications");
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
}

/**
 * Reschedule all notifications for active tasks
 * Useful when app starts to ensure all notifications are scheduled
 */
export async function rescheduleAllTaskNotifications(tasks: Task[]): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    // Only schedule notifications for tasks that are not completed or cancelled
    const activeTasks = tasks.filter(
      (task) => task.status !== "completed" && task.status !== "cancelled"
    );

    for (const task of activeTasks) {
      await scheduleTaskNotification(task);
    }

    console.log(`Rescheduled notifications for ${activeTasks.length} active tasks`);
  } catch (error) {
    console.error("Error rescheduling notifications:", error);
  }
}

