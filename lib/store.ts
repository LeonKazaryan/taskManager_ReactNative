import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus, SortOrder, ActionLog, ActionType, SyncOperation, SyncStatus, SyncOperationType } from './types';
import { nanoid } from 'nanoid/non-secure';
import { immer } from 'zustand/middleware/immer';
import { scheduleTaskNotification, cancelTaskNotification, rescheduleAllTaskNotifications } from './notifications';
import { syncPendingOperations } from './sync';

type State = {
    tasks: Task[];
    actionLogs: ActionLog[];
    sortOrder: SortOrder;
    pendingSync: SyncOperation[];
    syncStatus: SyncStatus;
    addTask: (data: Omit<Task, "id" | "createdAt" | "status">) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    setStatus: (id: string, status: TaskStatus) => void;
    setSortOrder: (order: SortOrder) => void;
    getSortedTasks: () => Task[];
    getActionLogs: () => ActionLog[];
    clearActionLogs: () => void;
    initializeNotifications: () => Promise<void>;
    syncTasks: () => Promise<void>;
    addSyncOperation: (type: SyncOperationType, taskId: string, taskData?: Task) => void;
    removeSyncOperation: (operationId: string) => void;
};

export const useTaskStore = create<State>()(
    persist(
        immer((set, get) => ({
            tasks: [],
            actionLogs: [],
            sortOrder: 'dateAdded_desc',
            pendingSync: [],
            syncStatus: 'idle',
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
                    // newTask is already a plain object, so it's safe to pass directly
                    scheduleTaskNotification(newTask).catch(console.error);
                    
                    // Add sync operation
                    state.pendingSync.push({
                        id: nanoid(),
                        type: 'create',
                        taskId: newTask.id,
                        taskData: newTask,
                        timestamp: new Date().toISOString(),
                        retries: 0,
                    });
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
                            // Create a plain object from the Proxy to avoid "Proxy handler is null" error
                            const plainTask = {
                                id: updatedTask.id,
                                title: updatedTask.title,
                                description: updatedTask.description,
                                datetime: updatedTask.datetime,
                                location: updatedTask.location,
                                coordinates: updatedTask.coordinates,
                                attachments: updatedTask.attachments,
                                createdAt: updatedTask.createdAt,
                                status: updatedTask.status,
                            };
                            scheduleTaskNotification(plainTask).catch(console.error);
                            
                            // Add sync operation
                            state.pendingSync.push({
                                id: nanoid(),
                                type: 'update',
                                taskId: id,
                                taskData: plainTask,
                                timestamp: new Date().toISOString(),
                                retries: 0,
                            });
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
                        
                        // Add sync operation
                        state.pendingSync.push({
                            id: nanoid(),
                            type: 'delete',
                            taskId: id,
                            timestamp: new Date().toISOString(),
                            retries: 0,
                        });
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
                            // Create a plain object from the Proxy to avoid "Proxy handler is null" error
                            const plainTask = {
                                id: task.id,
                                title: task.title,
                                description: task.description,
                                datetime: task.datetime,
                                location: task.location,
                                coordinates: task.coordinates,
                                attachments: task.attachments,
                                createdAt: task.createdAt,
                                status: task.status,
                            };
                            scheduleTaskNotification(plainTask).catch(console.error);
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
            },
            addSyncOperation: (type, taskId, taskData) =>
                set((state) => {
                    const operation: SyncOperation = {
                        id: nanoid(),
                        type,
                        taskId,
                        taskData,
                        timestamp: new Date().toISOString(),
                        retries: 0,
                    };
                    state.pendingSync.push(operation);
                }),
            removeSyncOperation: (operationId) =>
                set((state) => {
                    state.pendingSync = state.pendingSync.filter(op => op.id !== operationId);
                }),
            syncTasks: async () => {
                const { pendingSync } = get();
                
                // Если нет операций для синхронизации, выходим
                if (pendingSync.length === 0) {
                    return;
                }

                // Если уже идет синхронизация, не запускаем еще одну
                if (get().syncStatus === 'syncing') {
                    return;
                }

                set((state) => {
                    state.syncStatus = 'syncing';
                });

                try {
                    await syncPendingOperations(
                        pendingSync,
                        // onOperationComplete
                        (operationId) => {
                            set((state) => {
                                state.pendingSync = state.pendingSync.filter(op => op.id !== operationId);
                            });
                        },
                        // onOperationFailed - операция превысила лимит retries
                        (operationId, error) => {
                            console.error('Sync operation failed after max retries:', error);
                            set((state) => {
                                // Удаляем операцию, так как превышен лимит попыток
                                state.pendingSync = state.pendingSync.filter(op => op.id !== operationId);
                            });
                        },
                        // onOperationRetry - операция провалилась, но retries < MAX_RETRIES
                        (operationId) => {
                            set((state) => {
                                // Увеличиваем retries для операции, которая останется в очереди
                                const operation = state.pendingSync.find(op => op.id === operationId);
                                if (operation) {
                                    operation.retries += 1;
                                }
                            });
                        }
                    );

                    set((state) => {
                        state.syncStatus = 'success';
                    });
                } catch (error) {
                    console.error('Sync failed:', error);
                    set((state) => {
                        state.syncStatus = 'error';
                    });
                } finally {
                    // Через 2 секунды сбрасываем статус на idle
                    setTimeout(() => {
                        set((state) => {
                            if (state.syncStatus === 'success' || state.syncStatus === 'error') {
                                state.syncStatus = 'idle';
                            }
                        });
                    }, 2000);
                }
            }
        })),
        { 
            name: "tm:tasks:v2", 
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);