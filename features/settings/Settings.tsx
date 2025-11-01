import React from 'react';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SunIcon, MoonIcon } from '../../components/Icons';

interface SettingsProps {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    language: string;
    onLanguageChange: (lang: string) => void;
}

const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void; }> = ({ theme, setTheme }) => (
    <div className="flex items-center space-x-2">
        <button type="button" onClick={() => setTheme('light')} aria-label="Switch to light theme">
            <SunIcon className={`w-6 h-6 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
        </button>
        {/* FIX: Replaced div with button for accessibility and added screen reader text. */}
        <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-14 h-8 flex items-center bg-slate-200 dark:bg-slate-700 rounded-full p-1 cursor-pointer"
        >
            <span className="sr-only">Toggle theme</span>
            <span className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}></span>
        </button>
        <button type="button" onClick={() => setTheme('dark')} aria-label="Switch to dark theme">
            <MoonIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
        </button>
    </div>
);


export const Settings: React.FC<SettingsProps> = ({ theme, setTheme, language, onLanguageChange }) => {
    const settingsOptions = [
        {
            title: "Appearance",
            description: "Customize the look and feel of the application.",
            control: <ThemeToggle theme={theme} setTheme={setTheme} />
        },
        {
            title: "Language",
            description: "Select your preferred language for the user interface.",
            control: <LanguageSelector selected={language} onSelect={onLanguageChange} />
        }
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-brand-dark">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-8">Settings</h2>
                <div className="bg-white dark:bg-brand-medium rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                    {settingsOptions.map(option => (
                         <div key={option.title} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-brand-dark dark:text-white">{option.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{option.description}</p>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                {option.control}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
