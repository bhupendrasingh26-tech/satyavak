import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LANGUAGES, View } from './constants';
import type { User, Notification, GeneratedDocument } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './features/dashboard/Dashboard';
import { AIChatbot } from './features/chatbot/AIChatbot';
import { ExpertLocator } from './features/locator/ExpertLocator';
import { VirtualCourtroom } from './features/courtroom/VirtualCourtroom';
import { DocumentGenerator } from './features/generator/DocumentGenerator';
import { CaseStudiesNews } from './features/news/CaseStudiesNews';
import { SMSHelp } from './features/sms/SMSHelp';
import { Login } from './features/auth/Login';
import { UserProfile } from './features/profile/UserProfile';
import { Settings } from './features/settings/Settings';
import { Notifications } from './features/notifications/Notifications';

const USER_KEY = 'satyavak_user';
const THEME_KEY = 'satyavak_theme';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('dashboard');
    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
    });
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'Welcome to Satyavāk!', description: 'Explore our features to get started with AI legal assistance.', timestamp: '5 minutes ago', read: false },
        { id: '2', title: 'Document Generated', description: 'Your "Rental Agreement" draft is ready.', timestamp: '1 hour ago', read: true },
        { id: '3', title: 'New Case Studies', description: 'Check out the latest analysis on landmark judgements.', timestamp: '3 hours ago', read: false },
    ]);
    const viewHistory = useRef<View[]>(['dashboard']);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(USER_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error)
        {
            console.error("Failed to load user from storage:", error);
            localStorage.removeItem(USER_KEY);
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.error("Failed to save theme to storage:", error);
        }
    }, [theme]);


    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
        } catch (error) {
            console.error("Failed to save user to storage:", error);
        }
        setView('dashboard');
        viewHistory.current = ['dashboard'];
    };

    const handleLogout = () => {
        setUser(null);
        try {
            localStorage.removeItem(USER_KEY);
        } catch (error) {
            console.error("Failed to remove user from storage:", error);
        }
        setView('dashboard');
        viewHistory.current = ['dashboard'];
    };

    const handleMarkAsRead = (id: string) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const navigateTo = useCallback((newView: View) => {
        if (newView !== view) {
            viewHistory.current.push(newView);
            setView(newView);
        }
    }, [view]);

    const goBack = useCallback(() => {
        if (viewHistory.current.length > 1) {
            viewHistory.current.pop();
            setView(viewHistory.current[viewHistory.current.length - 1]);
        }
    }, []);
    

    const handleSaveDocument = (doc: GeneratedDocument) => {
        if (!user) return;
        setUser(currentUser => {
            if (!currentUser) return null;
            const updatedUser = { 
                ...currentUser, 
                generatedDocuments: [doc, ...currentUser.generatedDocuments] 
            };
            try {
                localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            } catch (error) {
                console.error("Failed to save document to user profile:", error);
            }
            return updatedUser;
        });
    };

    const renderView = () => {
        if (!user) return null;
        switch (view) {
            case 'dashboard': return <Dashboard user={user} />;
            case 'chatbot': return <AIChatbot language={language} />;
            case 'locator': return <ExpertLocator language={language} />;
            case 'courtroom': return <VirtualCourtroom language={language}/>;
            case 'generator': return <DocumentGenerator language={language} onSaveDocument={handleSaveDocument} />;
            case 'casestudies': return <CaseStudiesNews language={language} />;
            case 'sms': return <SMSHelp />;
            case 'profile': return <UserProfile user={user} />;
            case 'settings': return <Settings theme={theme} setTheme={setTheme} language={language} onLanguageChange={setLanguage} />;
            case 'notifications': return <Notifications notifications={notifications} onMarkAsRead={handleMarkAsRead} />;
            default: return <Dashboard user={user} />;
        }
    };

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-brand-light dark:bg-brand-dark font-sans">
            <Sidebar 
                currentView={view} 
                onNavigate={navigateTo} 
                isCollapsed={isSidebarCollapsed} 
                setIsCollapsed={setIsSidebarCollapsed}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    user={user} 
                    onNavigate={navigateTo} 
                    onBack={goBack} 
                    currentView={view} 
                    onLogout={handleLogout}
                    unreadCount={notifications.filter(n => !n.read).length}
                />
                <main className="flex-1 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;