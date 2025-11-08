export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export type Attachment = {
    uri: string;
    name: string;
    type: string; // mime type
    size?: number;
}

export type LocationCoordinates = {
    latitude: number;
    longitude: number;
}

export type Task = {
    id: string;
    title: string;
    description?: string;
    datetime: string;
    location: string;
    coordinates?: LocationCoordinates;
    status: TaskStatus;
    attachments?: Attachment[];
    createdAt: string;
}

export type SortOrder = 'dateAdded_desc' | 'dateAdded_asc' | 'status';

export type ActionType = 'created' | 'updated' | 'deleted' | 'status_changed';

export type ActionLog = {
    id: string;
    taskId: string;
    taskTitle: string;
    actionType: ActionType;
    timestamp: string;
    details?: string; // Additional info like old status -> new status
}