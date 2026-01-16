
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Task } from '../api/tasks';
import { X, Calendar, Flag, Tag, Clock } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import clsx from 'clsx';


interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onEdit?: (task: Task) => void;
}

const priorityColors = {
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, onEdit }) => {
    const { t, i18n } = useTranslation();

    if (!task) return null;

    const fnLocale = i18n.language === 'es' ? es : enUS;

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'LOW': return t('tasks.priorityLow');
            case 'MEDIUM': return t('tasks.priorityMedium');
            case 'HIGH': return t('tasks.priorityHigh');
            default: return priority;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return t('tasks.statusPending');
            case 'IN_PROGRESS': return t('tasks.statusInProgress');
            case 'COMPLETED': return t('tasks.statusCompleted');
            default: return status;
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center overflow-y-auto p-4"
                            >
                                <Dialog.Content asChild>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full max-w-2xl relative z-50"
                                    >
                                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden w-full flex flex-col max-h-[90vh]">
                                            {/* Header */}
                                            <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-gray-700">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={clsx(
                                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide",
                                                            task.status === 'COMPLETED' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                                                                task.status === 'IN_PROGRESS' ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" :
                                                                    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                        )}>
                                                            {getStatusLabel(task.status)}
                                                        </span>
                                                        <span className={clsx(
                                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide",
                                                            priorityColors[task.priority]
                                                        )}>
                                                            <Flag className="w-3 h-3 mr-1" />
                                                            {getPriorityLabel(task.priority)}
                                                        </span>
                                                    </div>
                                                    <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                                        {task.title}
                                                    </Dialog.Title>
                                                </div>
                                                <Dialog.Close asChild>
                                                    <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 transition-colors">
                                                        <X className="h-6 w-6" />
                                                    </button>
                                                </Dialog.Close>
                                            </div>

                                            {/* Body */}
                                            <div className="p-6 overflow-y-auto space-y-8">
                                                {/* Description */}
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                                        {t('tasks.description')}
                                                    </h4>
                                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                        {task.description || <span className="italic text-gray-400">{t('tasks.noDescription')}</span>}
                                                    </p>
                                                </div>

                                                {/* Meta Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            {t('tasks.dueDate')}
                                                        </h4>
                                                        <p className="text-gray-900 dark:text-white font-medium">
                                                            {task.dueDate
                                                                ? format(new Date(task.dueDate), "PPP p", { locale: fnLocale })
                                                                : <span className="text-gray-400 italic">{t('tasks.noDueDate')}</span>
                                                            }
                                                        </p>
                                                    </div>

                                                    {task.tags && task.tags.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                                                <Tag className="w-4 h-4" />
                                                                {t('tasks.tags')}
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {task.tags.map((tag, i) => (
                                                                    <span key={i} className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Timestamps */}
                                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 flex flex-col gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{t('common.created')}: {format(new Date(task.createdAt), "PPP p", { locale: fnLocale })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{t('common.updated')}: {format(new Date(task.updatedAt), "PPP p", { locale: fnLocale })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            {onEdit && (
                                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                                    <button
                                                        onClick={() => {
                                                            onClose();
                                                            onEdit(task);
                                                        }}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        {t('common.edit')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </Dialog.Content>
                            </motion.div>
                        </Dialog.Overlay>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
};

export default TaskDetailModal;
