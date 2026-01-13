import api from './axios';

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    _count?: {
        tasks: number;
    };
    tasks?: any[]; // Simplified for list view
}

export interface CreateProjectPayload {
    name: string;
    description?: string;
}

export interface UpdateProjectPayload {
    name?: string;
    description?: string;
}

export const getProjects = async (): Promise<Project[]> => {
    const response = await api.get<{ data: { projects: Project[] } }>('/projects');
    return response.data.data.projects;
};

export const getProjectById = async (id: string): Promise<Project> => {
    const response = await api.get<{ data: { project: Project } }>(`/projects/${id}`);
    return response.data.data.project;
};

export const createProject = async (data: CreateProjectPayload): Promise<Project> => {
    const response = await api.post<{ data: { project: Project } }>('/projects', data);
    return response.data.data.project;
};

export const updateProject = async (id: string, data: UpdateProjectPayload): Promise<Project> => {
    const response = await api.put<{ data: { project: Project } }>(`/projects/${id}`, data);
    return response.data.data.project;
};

export const deleteProject = async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
};
