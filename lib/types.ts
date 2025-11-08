export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export type Attachment = {
    uri: string;
    name: string;
    type: string; // mime type
    size?: number;
}

export type Task = {
    id: string;
    title: string;
    description?: string;
    datetime: string;
    location: string;
    status: TaskStatus;
    attachments?: Attachment[];
    createdAt: string;
}

export type SortOrder = 'dateAdded_desc' | 'dateAdded_asc' | 'status';