import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus, SortOrder } from './types';
import { nanoid } from 'nanoid/non-secure';
import { immer } from 'zustand/middleware/immer';
import { scheduleTaskNotification, cancelTaskNotification, rescheduleAllTaskNotifications } from './notifications';

type State = {
    tasks: Task[];
    sortOrder: SortOrder;
    addTask: (data: Omit<Task, "id" | "createdAt" | "status">) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    setStatus: (id: string, status: TaskStatus) => void;
    setSortOrder: (order: SortOrder) => void;
    getSortedTasks: () => Task[];
    initializeNotifications: () => Promise<void>;
};

export const useTaskStore = create<State>()(
    persist(
        immer((set, get) => ({
            tasks: [],
            sortOrder: 'dateAdded_desc',
            addTask: (data) =>
                set((state) => {
                    const newTask: Task = {
                        ...data,
                        id: nanoid(),
                        createdAt: new Date().toISOString(),
                        status: 'todo'
                    };
                    state.tasks.push(newTask);
                    // Schedule notification for new task
                    scheduleTaskNotification(newTask).catch(console.error);
                }),
            updateTask: (id, updates) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (task) {
                        Object.assign(task, updates);
                        // Reschedule notification if task was updated
                        const updatedTask = state.tasks.find(t => t.id === id);
                        if (updatedTask) {
                            scheduleTaskNotification(updatedTask).catch(console.error);
                        }
                    }
                }),
            deleteTask: (id) =>
                set((state) => {
                    state.tasks = state.tasks.filter(t => t.id !== id);
                    // Cancel notification for deleted task
                    cancelTaskNotification(id).catch(console.error);
                }),
            setStatus: (id, status) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (task) {
                        task.status = status;
                        // Cancel notification if task is completed or cancelled
                        if (status === 'completed' || status === 'cancelled') {
                            cancelTaskNotification(id).catch(console.error);
                        } else {
                            // Reschedule notification if task becomes active again
                            scheduleTaskNotification(task).catch(console.error);
                        }
                    }
                }),
            setSortOrder: (order) =>
                set((state) => {
                    state.sortOrder = order;
                }),
            getSortedTasks: () => {
                const { tasks, sortOrder } = get();
                const sorted = [...tasks];
                
                switch (sortOrder) {
                    case 'dateAdded_desc':
                        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    case 'dateAdded_asc':
                        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    case 'status':
                        const statusOrder = { 'in_progress': 0, 'todo': 1, 'completed': 2, 'cancelled': 3 };
                        return sorted.sort((a, b) => {
                            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                            if (statusDiff !== 0) return statusDiff;
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        });
                    default:
                        return sorted;
                }
            },
            initializeNotifications: async () => {
                const { tasks } = get();
                await rescheduleAllTaskNotifications(tasks);
            }
        })),
        { 
            name: "tm:tasks:v1", 
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
);