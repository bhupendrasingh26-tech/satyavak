import React from 'react';
import type { User } from '../../types';

export const Dashboard: React.FC<{ user: User }> = ({ user }) => {
    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark dark:text-white">
                Welcome back, {user.name.split(' ')[0]}!
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
                How can Satyavāk help you today? Select an option from the sidebar to get started.
            </p>
            <div className="mt-8 p-6 bg-white dark:bg-brand-medium rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold text-brand-dark dark:text-white">Your AI Legal Assistant</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    From understanding complex legal jargon with our <span className="font-semibold text-brand-secondary">AI Chatbot</span> to preparing for a hearing with the <span className="font-semibold text-brand-secondary">Virtual Courtroom</span>, we're here to democratize access to justice.
                </p>
            </div>
        </div>
    );
};