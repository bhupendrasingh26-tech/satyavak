import React from 'react';
import type { User } from '../types';
import type { View } from '../constants';
import { BackIcon, LogoutIcon, NotificationIcon, SettingsIcon } from './Icons';

interface HeaderProps {
    user: User;
    onNavigate: (view: View) => void;
    onBack: () => void;
    currentView: View;
    onLogout: () => void;
    unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({ user, onNavigate, onBack, currentView, onLogout, unreadCount }) => (
    <header className="bg-white dark:bg-brand-medium shadow-sm p-4 flex items-center justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-4">
            {currentView !== 'dashboard' && (
                <button onClick={onBack} className="text-slate-500 dark:text-slate-300 hover:text-brand-dark dark:hover:text-white transition-colors" aria-label="Go back">
                    <BackIcon className="w-6 h-6" />
                </button>
            )}
            <h1 className="text-xl font-bold text-brand-dark dark:text-white">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1).replace('casestudies', 'Case Studies')}
            </h1>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6">
            <button
                onClick={() => onNavigate('notifications')}
                className="relative text-slate-500 dark:text-slate-300 hover:text-brand-dark dark:hover:text-white transition-colors"
                aria-label="View notifications"
            >
                <NotificationIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                        {unreadCount}
                    </span>
                )}
            </button>
            <button
                onClick={() => onNavigate('settings')}
                className="text-slate-500 dark:text-slate-300 hover:text-brand-dark dark:hover:text-white transition-colors"
                aria-label="Open settings"
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
            <button onClick={() => onNavigate('profile')} aria-label="View profile">
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border-2 border-brand-accent hover:opacity-80 transition-opacity"/>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-600"></div>
            <button
                onClick={onLogout}
                className="text-slate-500 dark:text-slate-300 hover:text-brand-dark dark:hover:text-white transition-colors"
                aria-label="Logout"
            >
                <LogoutIcon className="w-6 h-6" />
            </button>
        </div>
    </header>
);