import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Button,
  TextInput,
  Card,
  Title,
  Surface,
  Text,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";
import { useTaskStore } from "../lib/store";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const { addTask } = useTaskStore();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

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
    });
    router.back();
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
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
                outlineColor="#e5e7eb"
                activeOutlineColor="#6366f1"
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
                outlineColor="#e5e7eb"
                activeOutlineColor="#6366f1"
              />
            )}
          />
          {errors.description && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.description.message}
            </Text>
          )}

          <View style={styles.datetimeContainer}>
            <Text variant="bodyMedium" style={styles.label}>
              Due Date & Time
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.datetimeButton}
              icon="calendar"
              textColor="#6366f1"
            >
              {formatDateTime(selectedDateTime)}
            </Button>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDateTime}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
          {errors.datetime && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.datetime.message}
            </Text>
          )}

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
                placeholder="Enter location manually"
                outlineColor="#e5e7eb"
                activeOutlineColor="#6366f1"
              />
            )}
          />
          {errors.location && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.location.message}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
              textColor="#6b7280"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
              style={styles.button}
              buttonColor="#6366f1"
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
  title: {
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#374151",
  },
  datetimeContainer: {
    marginBottom: 8,
  },
  datetimeButton: {
    marginBottom: 8,
    borderColor: "#6366f1",
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
});
