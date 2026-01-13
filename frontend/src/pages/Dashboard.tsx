import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, deleteTask, Task } from '../api/tasks';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const Dashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

    // Filtros
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [status, setStatus] = useState<string>('');
    const [priority, setPriority] = useState<string>('');

    const queryClient = useQueryClient();

    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks', { search: debouncedSearch, status, priority }],
        queryFn: () => getTasks({ search: debouncedSearch, status, priority }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const handleEdit = (task: Task) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteMutation.mutate(id);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTaskToEdit(null);
    };

    // Manejador de entrada de búsqueda con debounce (simplificado)
    // Un hook real es mejor. Crearé hooks/useDebounce.ts a continuación.

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    New Task
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                <div className="flex-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex space-x-4">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                    </select>

                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">All Priorities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-600">
                    Error loading tasks
                </div>
            ) : tasks?.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No tasks found. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {tasks?.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={closeModal}
                taskToEdit={taskToEdit}
            />
        </div>
    );
};

export default Dashboard;
