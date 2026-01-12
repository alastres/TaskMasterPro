import React from 'react';
import { Task } from '../api/tasks';
import { Badge, Calendar, Trash2, Edit2, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}

const priorityColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
};

const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                        <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', priorityColors[task.priority])}>
                            {task.priority}
                        </span>
                        <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[task.status])}>
                            {task.status.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>

                    <div className="mt-4 flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(task.createdAt), 'MMM d, yyyy')}
                        </div>
                        {task.tags && task.tags.length > 0 && (
                            <div className="flex space-x-1">
                                {task.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex space-x-2 ml-4">
                    <button
                        onClick={() => onEdit(task)}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                    >
                        <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
