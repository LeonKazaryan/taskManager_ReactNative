import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus, SortOrder, ActionLog, ActionType } from './types';
import { nanoid } from 'nanoid/non-secure';
import { immer } from 'zustand/middleware/immer';
import { scheduleTaskNotification, cancelTaskNotification, rescheduleAllTaskNotifications } from './notifications';

type State = {
    tasks: Task[];
    actionLogs: ActionLog[];
    sortOrder: SortOrder;
    addTask: (data: Omit<Task, "id" | "createdAt" | "status">) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    setStatus: (id: string, status: TaskStatus) => void;
    setSortOrder: (order: SortOrder) => void;
    getSortedTasks: () => Task[];
    getActionLogs: () => ActionLog[];
    clearActionLogs: () => void;
    initializeNotifications: () => Promise<void>;
};

export const useTaskStore = create<State>()(
    persist(
        immer((set, get) => ({
            tasks: [],
            actionLogs: [],
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
                    // Log action
                    state.actionLogs.unshift({
                        id: nanoid(),
                        taskId: newTask.id,
                        taskTitle: newTask.title,
                        actionType: 'created',
                        timestamp: new Date().toISOString(),
                    });
                    if (state.actionLogs.length > 500) {
                        state.actionLogs = state.actionLogs.slice(0, 500);
                    }
                    // Schedule notification for new task
                    scheduleTaskNotification(newTask).catch(console.error);
                }),
            updateTask: (id, updates) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (task) {
                        const oldTitle = task.title;
                        Object.assign(task, updates);
                        // Log action
                        const details = oldTitle !== task.title 
                            ? `Title: "${oldTitle}" → "${task.title}"`
                            : 'Task details updated';
                        state.actionLogs.unshift({
                            id: nanoid(),
                            taskId: id,
                            taskTitle: task.title,
                            actionType: 'updated',
                            timestamp: new Date().toISOString(),
                            details,
                        });
                        if (state.actionLogs.length > 500) {
                            state.actionLogs = state.actionLogs.slice(0, 500);
                        }
                        // Reschedule notification if task was updated
                        const updatedTask = state.tasks.find(t => t.id === id);
                        if (updatedTask) {
                            scheduleTaskNotification(updatedTask).catch(console.error);
                        }
                    }
                }),
            deleteTask: (id) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (task) {
                        // Log action before deleting
                        state.actionLogs.unshift({
                            id: nanoid(),
                            taskId: id,
                            taskTitle: task.title,
                            actionType: 'deleted',
                            timestamp: new Date().toISOString(),
                        });
                        if (state.actionLogs.length > 500) {
                            state.actionLogs = state.actionLogs.slice(0, 500);
                        }
                        state.tasks = state.tasks.filter(t => t.id !== id);
                        // Cancel notification for deleted task
                        cancelTaskNotification(id).catch(console.error);
                    }
                }),
            setStatus: (id, status) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (task) {
                        const oldStatus = task.status;
                        task.status = status;
                        // Log action
                        const statusLabels: Record<TaskStatus, string> = {
                            'todo': 'To Do',
                            'in_progress': 'In Progress',
                            'completed': 'Completed',
                            'cancelled': 'Cancelled',
                        };
                        const details = `${statusLabels[oldStatus]} → ${statusLabels[status]}`;
                        state.actionLogs.unshift({
                            id: nanoid(),
                            taskId: id,
                            taskTitle: task.title,
                            actionType: 'status_changed',
                            timestamp: new Date().toISOString(),
                            details,
                        });
                        if (state.actionLogs.length > 500) {
                            state.actionLogs = state.actionLogs.slice(0, 500);
                        }
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
            getActionLogs: () => {
                const { actionLogs } = get();
                return [...actionLogs].sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
            },
            clearActionLogs: () =>
                set((state) => {
                    state.actionLogs = [];
                }),
            initializeNotifications: async () => {
                const { tasks } = get();
                await rescheduleAllTaskNotifications(tasks);
            }
        })),
        { 
            name: "tm:tasks:v2", 
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);