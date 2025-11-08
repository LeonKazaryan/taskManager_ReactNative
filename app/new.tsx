import React from "react";
import { View, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import {
  Button,
  TextInput,
  Card,
  Title,
  Surface,
  Text,
  Chip,
  useTheme,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Attachment, LocationCoordinates } from "../lib/types";
import LocationPicker from "../components/LocationPicker";

const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(80, "Title must be 80 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  datetime: z
    .date()
    .refine(
      (date) => date >= new Date(),
      "Date must be in the future or present"
    ),
  location: z
    .string()
    .min(1, "Location is required")
    .max(120, "Location must be 120 characters or less"),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function NewTaskScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addTask } = useTaskStore();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);
  const [locationCoordinates, setLocationCoordinates] = React.useState<
    LocationCoordinates | undefined
  >(undefined);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      datetime: new Date(),
      location: "",
    },
    mode: "onChange",
  });

  const selectedDateTime = watch("datetime");

  const onSubmit = (data: TaskFormData) => {
    addTask({
      title: data.title,
      description: data.description || "",
      datetime: data.datetime.toISOString(),
      location: data.location,
      coordinates: locationCoordinates,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    router.back();
  };

  const handleLocationSelect = (
    location: string,
    coordinates: LocationCoordinates
  ) => {
    setValue("location", location, { shouldValidate: true });
    setLocationCoordinates(coordinates);
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need access to your photos to attach images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: Attachment[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
          size: asset.fileSize,
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: Attachment[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
          size: asset.size,
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDateTime = selectedDateTime;
      const newDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        currentDateTime.getHours(),
        currentDateTime.getMinutes()
      );
      setValue("datetime", newDateTime, { shouldValidate: true });
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentDateTime = selectedDateTime;
      const newDateTime = new Date(
        currentDateTime.getFullYear(),
        currentDateTime.getMonth(),
        currentDateTime.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
      setValue("datetime", newDateTime, { shouldValidate: true });
    }
  };

  const formatDateTime = (date: Date) => {
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
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
          <Text
            variant="headlineSmall"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Create New Task
          </Text>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Title"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.title}
                style={styles.input}
                mode="outlined"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
            )}
          />
          {errors.title && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.title.message}
            </Text>
          )}

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Description"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.description}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
            )}
          />
          {errors.description && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.description.message}
            </Text>
          )}

          <View style={styles.datetimeContainer}>
            <Text
              variant="bodyMedium"
              style={[styles.label, { color: theme.colors.onSurface }]}
            >
              Due Date & Time
            </Text>
            <View style={styles.datetimeButtonsRow}>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.datetimeButton,
                  styles.dateButton,
                  { borderColor: theme.colors.primary },
                ]}
                icon="calendar"
                textColor={theme.colors.primary}
              >
                {selectedDateTime.toLocaleDateString()}
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={[
                  styles.datetimeButton,
                  styles.timeButton,
                  { borderColor: theme.colors.primary },
                ]}
                icon="clock-outline"
                textColor={theme.colors.primary}
              >
                {selectedDateTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Button>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDateTime}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={selectedDateTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
                is24Hour={false}
              />
            )}
          </View>
          {errors.datetime && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.datetime.message}
            </Text>
          )}

          <View style={styles.locationSection}>
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Location"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.location}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Enter location manually or select on map"
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
              )}
            />
            <Button
              mode="outlined"
              onPress={() => setShowLocationPicker(true)}
              style={[
                styles.mapLocationButton,
                { borderColor: theme.colors.primary },
              ]}
              icon="map-marker"
              textColor={theme.colors.primary}
            >
              Select on Map
            </Button>
          </View>
          {errors.location && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.location.message}
            </Text>
          )}

          <LocationPicker
            visible={showLocationPicker}
            onClose={() => setShowLocationPicker(false)}
            onSelect={handleLocationSelect}
            initialCoordinates={locationCoordinates}
          />

          <View style={styles.attachmentsSection}>
            <Text
              variant="titleMedium"
              style={[styles.label, { color: theme.colors.onSurface }]}
            >
              Attachments
            </Text>
            <View style={styles.attachmentButtons}>
              <Button
                mode="outlined"
                onPress={pickImage}
                style={[
                  styles.attachmentButton,
                  { borderColor: theme.colors.primary },
                ]}
                icon="image"
                textColor={theme.colors.primary}
              >
                Add Images
              </Button>
              <Button
                mode="outlined"
                onPress={pickDocument}
                style={[
                  styles.attachmentButton,
                  { borderColor: theme.colors.primary },
                ]}
                icon="file-document"
                textColor={theme.colors.primary}
              >
                Add Files
              </Button>
            </View>
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <Chip
                    key={index}
                    style={styles.attachmentChip}
                    onClose={() => removeAttachment(index)}
                    icon={
                      attachment.type.startsWith("image/") ? "image" : "file"
                    }
                  >
                    {attachment.name}
                  </Chip>
                ))}
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={[styles.button, { borderColor: theme.colors.outline }]}
              textColor={theme.colors.onSurfaceVariant}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
              style={styles.button}
              buttonColor={theme.colors.primary}
            >
              Create Task
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
  },
  card: {
    margin: 16,
    borderRadius: 16,
  },
  content: {
    padding: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "700",
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
  },
  datetimeContainer: {
    marginBottom: 8,
  },
  datetimeButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  datetimeButton: {
    flex: 1,
  },
  dateButton: {
    flex: 1,
  },
  timeButton: {
    flex: 1,
  },
  locationSection: {
    marginBottom: 8,
  },
  mapLocationButton: {
    marginTop: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 16,
    marginTop: -4,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
  },
  attachmentsSection: {
    marginBottom: 16,
  },
  attachmentButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  attachmentButton: {
    flex: 1,
  },
  attachmentsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attachmentChip: {
    marginBottom: 4,
  },
});
