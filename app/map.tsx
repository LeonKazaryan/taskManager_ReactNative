import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { Surface, Text, Button, Chip, FAB, useTheme } from "react-native-paper";

// Try to import maps, but handle if not available
let MapView: any = null;
let Marker: any = null;
try {
  const maps = require("expo-maps");
  MapView = maps.MapView;
  Marker = maps.Marker;
} catch (e) {
  console.log("Maps module not available, using fallback");
}
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import { useThemeStore } from "../lib/themeStore";
import { lightStatusColors, darkStatusColors } from "../lib/theme";
import { Task, TaskStatus } from "../lib/types";
import {
  getCurrentPositionAsync,
  requestLocationPermissions,
} from "../lib/location";

const StatusChip = ({ status }: { status: TaskStatus }) => {
  const { themeMode } = useThemeStore();
  const statusColors =
    themeMode === "dark" ? darkStatusColors : lightStatusColors;
  const config = statusColors[status] || {
    color: themeMode === "dark" ? "#9ca3af" : "#6b7280",
    backgroundColor: themeMode === "dark" ? "#374151" : "#f3f4f6",
  };

  return (
    <Chip
      style={{
        backgroundColor: config.color,
        paddingHorizontal: 4,
      }}
      textStyle={{ color: "#ffffff", fontSize: 10, fontWeight: "600" }}
    >
      {status === "in_progress" ? "In Progress" : status}
    </Chip>
  );
};

export default function MapScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { tasks } = useTaskStore();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter tasks that have coordinates
  const tasksWithLocation = tasks.filter(
    (task) =>
      task.coordinates &&
      task.status !== "completed" &&
      task.status !== "cancelled"
  );

  useEffect(() => {
    const initLocation = async () => {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Location Permission",
          "Please enable location permissions to see your current location on the map."
        );
        return;
      }

      const position = await getCurrentPositionAsync();
      if (position) {
        setUserLocation(position);
      }
    };

    initLocation();
  }, []);

  const initialRegion = userLocation || {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const { themeMode } = useThemeStore();
  const statusColors =
    themeMode === "dark" ? darkStatusColors : lightStatusColors;
  const getStatusColor = (status: TaskStatus) => {
    return (
      statusColors[status]?.color ||
      (themeMode === "dark" ? "#9ca3af" : "#6b7280")
    );
  };

  const mapsAvailable = MapView !== null && Marker !== null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {mapsAvailable ? (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={true}
          onPress={() => setSelectedTask(null)}
        >
          {tasksWithLocation.map((task) => (
            <Marker
              key={task.id}
              coordinate={task.coordinates!}
              onPress={() => setSelectedTask(task)}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerPin,
                    { backgroundColor: getStatusColor(task.status) },
                  ]}
                >
                  <Text style={styles.markerText}>
                    {task.title.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      ) : (
        <ScrollView
          style={[
            styles.fallbackContainer,
            { backgroundColor: theme.colors.background },
          ]}
          contentContainerStyle={styles.fallbackContent}
        >
          <View
            style={[
              styles.fallbackHeader,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Text
              variant="headlineSmall"
              style={[styles.fallbackTitle, { color: theme.colors.onSurface }]}
            >
              📍 Tasks with Locations
            </Text>
          </View>
          <Text
            variant="bodySmall"
            style={[styles.fallbackSubtext, { color: theme.colors.onSurface }]}
          >
            {tasksWithLocation.length} task
            {tasksWithLocation.length !== 1 ? "s" : ""} with location
            {tasksWithLocation.length !== 1 ? "s" : ""}:
          </Text>
          {tasksWithLocation.length > 0 ? (
            <View style={styles.tasksList}>
              {tasksWithLocation.map((task) => (
                <Surface
                  key={task.id}
                  style={[
                    styles.taskItem,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  elevation={1}
                >
                  <View style={styles.taskItemContent}>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.taskItemTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {task.title}
                    </Text>
                    <StatusChip status={task.status} />
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.taskItemLocation,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      📍 {task.location}
                    </Text>
                    {task.coordinates && (
                      <>
                        <Text
                          variant="bodySmall"
                          style={[
                            styles.taskItemCoords,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          {task.coordinates.latitude.toFixed(6)},{" "}
                          {task.coordinates.longitude.toFixed(6)}
                        </Text>
                        <Button
                          mode="outlined"
                          onPress={() => {
                            if (!task.coordinates) return;
                            const { latitude, longitude } = task.coordinates;
                            const url =
                              Platform.OS === "ios"
                                ? `maps://maps.apple.com/?q=${latitude},${longitude}`
                                : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
                            Linking.openURL(url).catch(() => {
                              // Fallback to web maps
                              const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                              Linking.openURL(webUrl);
                            });
                          }}
                          style={[
                            styles.openMapsButton,
                            { borderColor: theme.colors.primary },
                          ]}
                          icon="map"
                          textColor={theme.colors.primary}
                          compact
                        >
                          Open in Maps
                        </Button>
                      </>
                    )}
                    <Button
                      mode="contained"
                      onPress={() => router.push(`/task/${task.id}`)}
                      style={styles.taskItemButton}
                      buttonColor={theme.colors.primary}
                      compact
                    >
                      View Details
                    </Button>
                  </View>
                </Surface>
              ))}
            </View>
          ) : (
            <Text
              variant="bodyMedium"
              style={[
                styles.noTasksText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              No tasks with locations yet
            </Text>
          )}
        </ScrollView>
      )}

      {selectedTask && mapsAvailable && (
        <Surface
          style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}
          elevation={4}
        >
          <View style={styles.taskCardContent}>
            <View style={styles.taskCardHeader}>
              <Text
                variant="titleMedium"
                style={[
                  styles.taskCardTitle,
                  { color: theme.colors.onSurface },
                ]}
                numberOfLines={2}
              >
                {selectedTask.title}
              </Text>
              <StatusChip status={selectedTask.status} />
            </View>

            {selectedTask.description && (
              <Text
                variant="bodySmall"
                style={[
                  styles.taskCardDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
              >
                {selectedTask.description}
              </Text>
            )}

            <Text
              variant="bodySmall"
              style={[
                styles.taskCardLocation,
                { color: theme.colors.onSurface },
              ]}
            >
              📍 {selectedTask.location}
            </Text>

            <View style={styles.taskCardActions}>
              <Button
                mode="outlined"
                onPress={() => setSelectedTask(null)}
                style={[
                  styles.cancelButton,
                  { borderColor: theme.colors.outline },
                ]}
                textColor={theme.colors.onSurfaceVariant}
              >
                Close
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setSelectedTask(null);
                  router.push(`/task/${selectedTask.id}`);
                }}
                style={styles.viewButton}
                buttonColor={theme.colors.primary}
              >
                View Details
              </Button>
            </View>
          </View>
        </Surface>
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => router.push("/new")}
        label="New Task"
        size="large"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  taskCard: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
  },
  taskCardContent: {
    padding: 16,
  },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskCardTitle: {
    flex: 1,
    marginRight: 12,
    fontWeight: "600",
  },
  taskCardDescription: {
    marginBottom: 8,
    lineHeight: 18,
  },
  taskCardLocation: {
    marginBottom: 12,
    fontWeight: "500",
  },
  taskCardActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  viewButton: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  fallbackContainer: {
    flex: 1,
  },
  fallbackContent: {
    padding: 24,
  },
  fallbackHeader: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  fallbackTitle: {
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  fallbackText: {
    lineHeight: 20,
    textAlign: "center",
  },
  fallbackSubtext: {
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    borderRadius: 12,
    marginBottom: 12,
  },
  taskItemContent: {
    padding: 16,
    gap: 8,
  },
  taskItemTitle: {
    fontWeight: "600",
  },
  taskItemLocation: {
    fontWeight: "500",
  },
  taskItemCoords: {
    fontFamily: "monospace",
    fontSize: 11,
  },
  openMapsButton: {
    marginTop: 4,
  },
  taskItemButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  noTasksText: {
    textAlign: "center",
    marginTop: 24,
  },
});
