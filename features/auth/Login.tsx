import React, { useState } from 'react';
import type { User } from '../../types';
import { Spinner } from '../../components/Spinner';

interface LoginProps {
    onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Please enter your full name.');
            return;
        }
        if (!/^\d{4}$/.test(pin)) {
            setError('PIN must be exactly 4 digits.');
            return;
        }

        setIsLoading(true);
        // Simulate network delay for a better UX
        setTimeout(() => {
            const trimmedName = name.trim();
            const mockUser: User = {
                name: trimmedName,
                email: `${trimmedName.replace(/\s+/g, '.').toLowerCase()}@satyavak.ai`,
                avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`,
                generatedDocuments: [],
            };
            onLogin(mockUser);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md text-center">
                <h1 className="text-5xl font-bold text-white mb-2">Satyavāk</h1>
                <p className="text-brand-accent mb-8">AI-Powered Legal Assistance for All</p>

                <div className="bg-brand-medium p-8 rounded-lg shadow-2xl">
                    <h2 className="text-2xl font-semibold text-white mb-6">Login to Your Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Full Name"
                                className="w-full p-3 bg-brand-dark text-white rounded-md border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                disabled={isLoading}
                                aria-required="true"
                            />
                        </div>
                        <div>
                            <label htmlFor="pin" className="sr-only">4-Digit PIN</label>
                            <input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="4-Digit PIN"
                                maxLength={4}
                                className="w-full p-3 bg-brand-dark text-white rounded-md border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                disabled={isLoading}
                                aria-required="true"
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-accent text-white font-bold py-3 px-6 rounded-md hover:bg-sky-400 disabled:bg-slate-500 transition-colors flex items-center justify-center"
                        >
                            {isLoading ? <Spinner className="w-6 h-6" /> : 'Login'}
                        </button>
                    </form>
                </div>
                <p className="text-xs text-slate-500 mt-6">
                    This is a demonstration. You can enter any name and any 4-digit PIN to proceed.
                </p>
            </div>
        </div>
    );
};