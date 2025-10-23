import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, TextInput, Card, Title } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTaskStore } from "../../lib/store";
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

export default function EditTaskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, updateTask } = useTaskStore();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const task = tasks.find((t) => t.id === id);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      datetime: task ? new Date(task.datetime) : new Date(),
      location: task?.location || "",
    },
    mode: "onChange",
  });

  const selectedDateTime = watch("datetime");

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

  const onSubmit = (data: TaskFormData) => {
    updateTask(task.id, {
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
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Edit Task</Title>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Title *"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.title}
                style={styles.input}
                mode="outlined"
              />
            )}
          />
          {errors.title && (
            <Title style={styles.errorText}>{errors.title.message}</Title>
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
              />
            )}
          />
          {errors.description && (
            <Title style={styles.errorText}>{errors.description.message}</Title>
          )}

          <View style={styles.datetimeContainer}>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.datetimeButton}
              icon="calendar"
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
            <Title style={styles.errorText}>{errors.datetime.message}</Title>
          )}

          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Location *"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.location}
                style={styles.input}
                mode="outlined"
                placeholder="Enter location manually"
              />
            )}
          />
          {errors.location && (
            <Title style={styles.errorText}>{errors.location.message}</Title>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
              style={styles.button}
            >
              Save Changes
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
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    marginBottom: 8,
  },
  datetimeContainer: {
    marginBottom: 8,
  },
  datetimeButton: {
    marginBottom: 8,
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
