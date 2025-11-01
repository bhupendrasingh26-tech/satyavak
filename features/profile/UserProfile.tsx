import React from 'react';
import type { User } from '../../types';
import { BotIcon, DocumentIcon, CourtroomIcon } from '../../components/Icons';

// The html-to-docx library is loaded via a script tag in index.html and attaches itself to the window object.

interface UserProfileProps {
    user: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    const stats = [
        { icon: <BotIcon className="w-6 h-6" />, label: "Chats Started", value: 27 },
        { icon: <DocumentIcon className="w-6 h-6" />, label: "Documents Generated", value: user.generatedDocuments.length },
        { icon: <CourtroomIcon className="w-6 h-6" />, label: "Simulations Completed", value: 3 },
    ];

    const handleDownload = async (content: string, docType: string) => {
        try {
            const fileBuffer = await (window as any).htmlToDocx(content, null, {
                footer: true,
                pageNumber: true,
            });
            const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${docType.replace(/\s/g, '_')}_${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Error creating .docx file:", e);
            alert("Could not create .docx file. An error occurred.");
        }
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-brand-dark">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-brand-medium rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left space-y-6 md:space-y-0 md:space-x-8">
                        <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full border-4 border-brand-accent shadow-md"/>
                        <div className="flex-grow">
                            <h2 className="text-4xl font-bold text-brand-dark dark:text-white">{user.name}</h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="flex flex-col items-center">
                                        <div className="text-brand-secondary">{stat.icon}</div>
                                        <p className="text-2xl font-bold text-brand-dark dark:text-white mt-2">{stat.value}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-white dark:bg-brand-medium rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-2xl font-semibold text-brand-dark dark:text-white mb-6">Generated Documents</h3>
                    {user.generatedDocuments.length > 0 ? (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {user.generatedDocuments.map(doc => (
                                <li key={doc.id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-brand-dark dark:text-white">{doc.docType}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Generated on {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(doc.content, doc.docType)}
                                        className="bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors text-sm flex items-center gap-2"
                                    >
                                        <DocumentIcon className="w-4 h-4" />
                                        Download
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-4">You have not generated any documents yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};