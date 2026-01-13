import React from 'react';
import { CheckCircle2, Circle, Tag, Trash2, Edit2, AlertCircle, Calendar } from 'lucide-react';
import { Task } from '../api/tasks';
import { format, isBefore } from 'date-fns';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface TaskCardProps {
    task: Task;
    onEdit?: (task: Task) => void;
    onDelete?: (id: string) => void;
    onToggleStatus: (task: Task) => void;
}

const priorityColors = {
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onToggleStatus }) => {
    const { t } = useTranslation();
    const isCompleted = task.status === 'COMPLETED';
    const isOverdue = task.dueDate && !isCompleted && isBefore(new Date(task.dueDate), new Date());

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'LOW': return t('tasks.priorityLow');
            case 'MEDIUM': return t('tasks.priorityMedium');
            case 'HIGH': return t('tasks.priorityHigh');
            default: return priority;
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={clsx(
                "bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 transition-all duration-200 group relative overflow-hidden",
                isCompleted
                    ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    : clsx(
                        "border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800",
                        isOverdue && "border-red-200 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-900/20"
                    )
            )}
        >
            {isCompleted && (
                <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-900/10 pointer-events-none" />
            )}

            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-start space-x-3 flex-1">
                    <button
                        onClick={() => onToggleStatus(task)}
                        className="mt-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full dark:focus:ring-offset-gray-800 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors"
                        aria-label={isCompleted ? t('tasks.markIncomplete') : t('tasks.markCompleted')}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isCompleted ? (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="circle"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    <Circle className="h-6 w-6" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={clsx(
                                "text-lg font-semibold text-gray-900 dark:text-white transition-all",
                                isCompleted && "line-through text-gray-500 dark:text-gray-400"
                            )}>
                                {task.title}
                            </h3>
                            {isOverdue && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                                    {t('tasks.overdue')}
                                </span>
                            )}
                        </div>
                        <p className={clsx(
                            "text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2",
                            isCompleted && "line-through text-gray-400 dark:text-gray-500"
                        )}>
                            {task.description}
                        </p>
                    </div>
                </div>

                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(task)}
                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label={t('tasks.editTaskAria')}
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(task.id)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={t('tasks.deleteTaskAria')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 relative z-10">
                <div className="flex items-center space-x-3 flex-wrap">
                    <span className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        priorityColors[task.priority]
                    )}>
                        {task.priority === 'HIGH' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {getPriorityLabel(task.priority)}
                    </span>

                    <span className={clsx(
                        "flex items-center text-xs font-medium",
                        task.dueDate
                            ? (isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400")
                            : "text-gray-400 italic"
                    )}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {task.dueDate
                            ? format(new Date(task.dueDate), t('tasks.dateFormat'))
                            : t('tasks.noDueDate')
                        }
                    </span>
                </div>

                {task.tags && task.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <div className="flex gap-1">
                            {task.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                                    {tag}
                                </span>
                            ))}
                            {task.tags.length > 2 && (
                                <span className="text-xs text-gray-400">+ {task.tags.length - 2}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TaskCard;
