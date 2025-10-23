export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export type Task = {
    id: string;
    title: string;
    description?: string;
    datetime: string;
    location: string;
    status: TaskStatus;
    createdAt: string;
}

export type SortOrder = 'dateAdded_desc' | 'dateAdded_asc' | 'status';