import React from 'react';
import type { Notification } from '../../types';

interface NotificationsProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAsRead }) => {

    const handleMarkAllRead = () => {
        notifications.forEach(n => {
            if (!n.read) onMarkAsRead(n.id);
        });
    };
    
    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-brand-dark">
            <div className="max-w-4xl mx-auto">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-brand-dark dark:text-white">Notifications</h2>
                    {notifications.some(n => !n.read) && (
                         <button onClick={handleMarkAllRead} className="text-sm font-semibold text-brand-secondary hover:underline">
                            Mark all as read
                         </button>
                    )}
                </div>
                
                <div className="bg-white dark:bg-brand-medium rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                    {notifications.length === 0 ? (
                        <p className="p-8 text-center text-slate-500 dark:text-slate-400">You have no new notifications.</p>
                    ) : (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {notifications.map(notification => (
                                <li key={notification.id} className={`p-6 flex items-start space-x-4 transition-colors ${!notification.read ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-brand-accent' : 'bg-transparent'}`}></div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-brand-dark dark:text-white">{notification.title}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{notification.description}</p>
                                        <p className="text-xs text-slate-400 mt-2">{notification.timestamp}</p>
                                    </div>
                                    {!notification.read && (
                                        <button onClick={() => onMarkAsRead(notification.id)} className="text-xs font-bold text-brand-accent hover:underline" aria-label={`Mark notification "${notification.title}" as read`}>
                                            Mark Read
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};