import React from 'react';
import type { View } from '../constants';
import { HomeIcon, BotIcon, LocatorIcon, CourtroomIcon, DocumentIcon, NewsIcon, SMSIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
}

const navItems: { view: View; label: string; icon: React.ReactNode; }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <HomeIcon className="w-6 h-6" /> },
    { view: 'chatbot', label: 'AI Chatbot', icon: <BotIcon className="w-6 h-6" /> },
    { view: 'locator', label: 'Expert Locator', icon: <LocatorIcon className="w-6 h-6" /> },
    { view: 'courtroom', label: 'Virtual Courtroom', icon: <CourtroomIcon className="w-6 h-6" /> },
    { view: 'generator', label: 'Document Generator', icon: <DocumentIcon className="w-6 h-6" /> },
    { view: 'casestudies', label: 'Case Studies & News', icon: <NewsIcon className="w-6 h-6" /> },
    { view: 'sms', label: 'SMS Help', icon: <SMSIcon className="w-6 h-6" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isCollapsed, setIsCollapsed }) => {
    return (
        <aside className={`bg-brand-medium text-slate-300 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`p-4 flex items-center border-b border-slate-700 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && <h1 className="text-xl font-bold text-white">Satyavāk</h1>}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)} 
                    className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
            </div>
            <nav className="flex-1 mt-4">
                <ul>
                    {navItems.map(item => (
                        <li key={item.view} className="px-4">
                            <button
                                onClick={() => onNavigate(item.view)}
                                className={`w-full flex items-center p-3 my-1 rounded-md transition-colors ${
                                    currentView === item.view
                                        ? 'bg-brand-accent text-white'
                                        : 'hover:bg-slate-700'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                {item.icon}
                                {!isCollapsed && <span className="ml-4 font-semibold flex-1 text-left">{item.label}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};