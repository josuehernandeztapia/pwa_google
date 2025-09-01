
import React from 'react';
import { Notification, NotificationType } from '../../types/index';
import { BellIcon, CheckCircleIcon, ExclamationCircleIcon, LightBulbIcon } from '../Shared/Icon';

interface NotificationsPanelProps {
    notifications: Notification[];
    onNotificationAction: (notification: Notification) => void;
    onClose: () => void;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
};

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    switch (type) {
        case NotificationType.Lead:
            return <BellIcon className="w-6 h-6 text-primary-cyan-400" />;
        case NotificationType.Milestone:
            return <CheckCircleIcon className="w-6 h-6 text-emerald-400" />;
        case NotificationType.Risk:
            return <ExclamationCircleIcon className="w-6 h-6 text-amber-400" />;
        case NotificationType.System:
            return <LightBulbIcon className="w-6 h-6 text-indigo-400" />;
        default:
            return <BellIcon className="w-6 h-6 text-gray-400" />;
    }
};


export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onNotificationAction, onClose }) => {
    return (
        <div 
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-white">Notificaciones</h3>
            </div>
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <BellIcon className="w-12 h-12 mx-auto mb-2"/>
                    <p>No hay notificaciones nuevas.</p>
                </div>
            ) : (
                <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => onNotificationAction(notification)}
                            className={`p-4 border-b border-gray-700/50 flex items-start gap-4 transition-colors ${notification.clientId ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}
                        >
                            <div className="flex-shrink-0 mt-1">
                                <NotificationIcon type={notification.type} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-200">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.timestamp)} atrás</p>
                                {notification.action && (
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNotificationAction(notification);
                                        }}
                                        className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-primary-cyan-600 rounded-md hover:bg-primary-cyan-700 transition-colors"
                                     >
                                        {notification.action.text}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
