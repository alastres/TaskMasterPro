import api from './axios';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    tags: string[];
    createdAt: string;
}

export interface CreateTaskPayload {
    title: string;
    description?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> { }

export interface TaskQuery {
    status?: string;
    priority?: string;
    search?: string;
    sort?: 'newest' | 'oldest';
}

export const getTasks = async (query: TaskQuery) => {
    const params = new URLSearchParams();
    if (query.status) params.append('status', query.status);
    if (query.priority) params.append('priority', query.priority);
    if (query.search) params.append('search', query.search);
    if (query.sort) params.append('sort', query.sort);

    const response = await api.get<{ data: { tasks: Task[] } }>(`/tasks?${params.toString()}`);
    return response.data.data.tasks;
};

export const createTask = async (data: CreateTaskPayload) => {
    const response = await api.post<{ data: { task: Task } }>('/tasks', data);
    return response.data.data.task;
};

export const updateTask = async (id: string, data: UpdateTaskPayload) => {
    const response = await api.patch<{ data: { task: Task } }>(`/tasks/${id}`, data);
    return response.data.data.task;
};

export const deleteTask = async (id: string) => {
    await api.delete(`/tasks/${id}`);
};
