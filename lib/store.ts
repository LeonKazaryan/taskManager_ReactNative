import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus, SortOrder } from './types';
import { nanoid } from 'nanoid/non-secure';
import { immer } from 'zustand/middleware/immer';

type State = {
    tasks: Task[];
    sortOrder: SortOrder;
    addTask: (data: Omit<Task, "id" | "createdAt" | "status">) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    setStatus: (id: string, status: TaskStatus) => void;
    setSortOrder: (order: SortOrder) => void;
    getSortedTasks: () => Task[];
};

export const useTaskStore = create<State>()(
    persist(
        immer((set, get) => ({
            tasks: [],
            sortOrder: 'dateAdded_desc',
            addTask: (data) =>
                set((state) => {
                    state.tasks.push({
                        ...data,
                        id: nanoid(),
                        createdAt: new Date().toISOString(),
                        status: 'todo'
                    });
                }),
            updateTask: (id, updates) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (task) {
                        Object.assign(task, updates);
                    }
                }),
            deleteTask: (id) =>
                set((state) => {
                    state.tasks = state.tasks.filter(t => t.id !== id);
                }),
            setStatus: (id, status) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (task) {
                        task.status = status;
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
            }
        })),
        { name: "tm:tasks:v1", storage: createJSONStorage(() => AsyncStorage) }
    )
);