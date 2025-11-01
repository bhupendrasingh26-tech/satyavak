import React from 'react';

export const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <div
        onClick={onClick}
        className='bg-white dark:bg-brand-medium rounded-lg shadow-lg p-6 flex flex-col items-start border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300'
    >
        <div className="bg-brand-secondary text-white p-3 rounded-full mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{description}</p>
    </div>
);