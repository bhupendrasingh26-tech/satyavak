import React, { useState, useEffect, useCallback } from 'react';
import { getChatbotResponse, translateText } from '../../services/geminiService';
import { ChatUI } from '../../components/ChatUI';
import type { ChatMessage, ChatSession } from '../../types';
import { LANGUAGE_MAP } from '../../constants';
import { NewChatIcon, TrashIcon } from '../../components/Icons';

const HISTORY_KEY = 'satyavak_chat_history';

const loadChatHistory = (): ChatSession[] => {
    try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
        console.error("Failed to load chat history:", error);
        return [];
    }
};

const saveChatHistory = (sessions: ChatSession[]): void => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
};

export const AIChatbot: React.FC<{ language: string }> = ({ language }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setSessions(loadChatHistory());
    }, []);

    useEffect(() => {
        saveChatHistory(sessions);
    }, [sessions]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;
    const geminiHistory = activeSession?.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.englishText }]
    })) || [];


    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: "New Chat",
            createdAt: Date.now(),
            messages: [],
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
    };
    
    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
    };

    const handleDeleteSession = (id: string) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
            setActiveSessionId(null);
        }
    };

    const handleSendMessage = async (englishMessage: string): Promise<void> => {
        if (!activeSessionId) {
            console.error("No active session to send message to.");
            return;
        }

        setIsLoading(true);

        const translatedUserInput = language === 'English' ? englishMessage : await translateText(englishMessage, LANGUAGE_MAP[language]);
        const userMessage: ChatMessage = { role: 'user', text: translatedUserInput, englishText: englishMessage };

        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                const isNewChat = s.messages.length === 0;
                return {
                    ...s,
                    title: isNewChat ? (englishMessage.substring(0, 30) + '...') : s.title,
                    messages: [...s.messages, userMessage]
                };
            }
            return s;
        }));

        try {
            const response = await getChatbotResponse(geminiHistory, englishMessage);
            const englishResponseText = response.text;
            const translatedResponseText = language === 'English' ? englishResponseText : await translateText(englishResponseText, LANGUAGE_MAP[language]);
            const modelMessage: ChatMessage = { role: 'model', text: translatedResponseText, englishText: englishResponseText };
            
            setSessions(prev => prev.map(s =>
                s.id === activeSessionId ? { ...s, messages: [...s.messages, modelMessage] } : s
            ));
        } catch (error) {
            console.error("Error fetching response:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again.", englishText: "Sorry, I encountered an error. Please try again." };
            setSessions(prev => prev.map(s =>
                s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareChat = () => {
        if (!activeSession) return;
        const chatText = activeSession.messages.map(msg =>
            `${msg.role === 'user' ? 'You' : 'Satyavāk'}:\n${msg.englishText}`
        ).join('\n\n');

        if (navigator.share) {
            navigator.share({
                title: `Satyavāk Chat: ${activeSession.title}`,
                text: chatText,
            }).catch(err => console.error("Share failed", err));
        } else {
            navigator.clipboard.writeText(chatText)
                .then(() => alert('Chat copied to clipboard!'))
                .catch(err => console.error('Failed to copy chat', err));
        }
    };

    return (
        <div className="flex h-full">
            <aside className="w-1/4 bg-brand-medium text-white flex flex-col">
                <div className="p-4 border-b border-slate-600">
                    <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-sky-400 text-white font-bold py-2 px-4 rounded">
                        <NewChatIcon className="w-5 h-5"/>
                        New Chat
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto">
                    {sessions.map(session => (
                        <div key={session.id} onClick={() => handleSelectSession(session.id)}
                           className={`p-3 m-2 rounded cursor-pointer flex justify-between items-center group ${activeSessionId === session.id ? 'bg-brand-dark' : 'hover:bg-slate-700'}`}>
                           <p className="truncate text-sm font-medium">{session.title}</p>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-4 h-4" />
                           </button>
                        </div>
                    ))}
                </nav>
            </aside>
            <main className="w-3/4">
                {activeSession ? (
                    <ChatUI 
                        language={language} 
                        chatTitle={activeSession.title}
                        messages={activeSession.messages}
                        isLoading={isLoading}
                        onSendMessage={handleSendMessage}
                        onShareChat={handleShareChat}
                    />
                ) : (
                    <div className="h-full flex flex-col justify-center items-center bg-slate-100 dark:bg-slate-900">
                         <h1 className="text-5xl font-bold text-brand-dark dark:text-white opacity-10">Satyavāk</h1>
                         <p className="text-slate-500 dark:text-slate-400 mt-2">Select a conversation or start a new one.</p>
                    </div>
                )}
            </main>
        </div>
    );
};