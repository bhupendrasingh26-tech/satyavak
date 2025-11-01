import React, { useState, useEffect, useRef } from 'react';
import { getChatbotResponse } from '../../services/geminiService';
import { Spinner } from '../../components/Spinner';

interface SMSMessage {
    sender: 'user' | 'bot';
    text: string;
}

export const SMSHelp: React.FC = () => {
    const [messages, setMessages] = useState<SMSMessage[]>([
        {
            sender: 'bot',
            text: "Welcome to Satyavāk SMS Help! This is a demo of how you can get legal information offline. Type your query below as if you were sending an SMS."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: SMSMessage = { sender: 'user', text: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Convert local SMS history to the format geminiService expects
            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            })).slice(1); // Remove the initial welcome message from history for better responses
            
            const response = await getChatbotResponse(history, trimmedInput);
            const botMessage: SMSMessage = { sender: 'bot', text: response.text };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("SMS Help bot error:", error);
            const errorMessage: SMSMessage = {
                sender: 'bot',
                text: "Sorry, I couldn't process that. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 flex flex-col items-center bg-slate-100 dark:bg-brand-dark min-h-full">
            <div className="w-full max-w-lg text-center mb-8">
                <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-2">Offline SMS Help Demo</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Even without internet, you can get legal information by sending an SMS to <strong className="text-brand-secondary whitespace-nowrap">+91-XXX-XXX-XXXX</strong>.
                    Try it out in the simulation below.
                </p>
            </div>

            {/* Phone Simulation */}
            <div className="w-full max-w-md bg-white dark:bg-black rounded-3xl shadow-2xl border-8 border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col h-[70vh]">
                {/* Header */}
                <div className="bg-slate-100 dark:bg-slate-800 p-3 flex items-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-auto"></div>
                    <div className="text-center">
                        <p className="font-semibold text-brand-dark dark:text-white">Satyavāk AI Bot</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">via SMS (+91-XXX...)</p>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 ml-auto"></div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl ${
                                msg.sender === 'user' 
                                ? 'bg-blue-500 text-white rounded-br-lg' 
                                : 'bg-slate-200 dark:bg-slate-700 text-brand-dark dark:text-white rounded-bl-lg'
                            }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="max-w-[80%] p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-brand-dark dark:text-white rounded-bl-lg flex items-center">
                                <Spinner className="w-4 h-4" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your SMS here..."
                            className="flex-1 p-2 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 dark:text-white"
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:bg-slate-400 transition-colors flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
