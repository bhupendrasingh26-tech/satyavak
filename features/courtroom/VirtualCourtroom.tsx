import React, { useState } from 'react';
import { CourtroomIcon } from '../../components/Icons';
import { LiveCourtroomSession } from './LiveCourtroomSession';

export interface CourtroomScenario {
    key: string;
    title: string;
    description: string;
    instructions: {
        role: string;
        objective: string;
        tips: string[];
    };
}

const scenarios: CourtroomScenario[] = [
    {
        key: 'consumer_complaint',
        title: 'Consumer Complaint Case',
        description: 'Argue your case against a company for a faulty product or poor service. Present your evidence and seek fair compensation for your grievance.',
        instructions: {
            role: 'You are the Complainant. You have purchased a product that turned out to be defective, and the company has refused to provide a refund or replacement.',
            objective: 'Clearly and concisely state the facts of your case, present any evidence you have (like receipts or photos), and persuade the judge to rule in your favor.',
            tips: [
                'Begin with a clear opening statement.',
                'Present your arguments in a chronological order.',
                'Refer to specific dates, amounts, and communications.',
                'Remain calm and respectful at all times.'
            ]
        }
    },
    {
        key: 'bail_application',
        title: 'Bail Application Hearing',
        description: 'Step into the shoes of a defense counsel arguing for your client\'s pre-trial release. Convince the court that your client is not a flight risk.',
        instructions: {
            role: 'You are the Defense Counsel. Your client has been arrested, and you are now arguing for their release on bail pending trial.',
            objective: 'Convince the judge that your client will not flee, tamper with evidence, or commit further crimes if released. Propose reasonable bail conditions.',
            tips: [
                'Emphasize your client\'s ties to the community (family, job).',
                'Address the prosecution\'s objections directly.',
                'Highlight your client\'s lack of a criminal record, if applicable.',
                'Argue that detention is not necessary.'
            ]
        }
    },
    {
        key: 'landlord_tenant_dispute',
        title: 'Landlord-Tenant Dispute',
        description: 'You are a tenant facing an eviction notice you believe is unjust. Argue your case, citing your rights and the terms of your rental agreement.',
        instructions: {
            role: 'You are the Tenant. Your landlord has served you an eviction notice, which you believe is unfair and retaliatory.',
            objective: 'Explain to the judge why the eviction is unlawful. Present your side of the story regarding rent payments, property maintenance, and communications with the landlord.',
            tips: [
                'Refer to your rental agreement or lease.',
                'Provide evidence of timely rent payments.',
                'Document all communication with your landlord.',
                'Clearly state the remedy you are seeking.'
            ]
        }
    },
    {
        key: 'motor_accident_claim',
        title: 'Motor Accident Claim',
        description: 'Represent a client who has been injured in a road accident. Argue for fair compensation to cover medical expenses and other damages.',
        instructions: {
            role: 'You are the Claimant\'s Counsel. Your client was injured in a motor accident due to the negligence of another driver.',
            objective: 'Establish the other driver\'s fault, detail the extent of your client\'s injuries and financial losses, and justify the amount of compensation being claimed.',
            tips: [
                'Clearly describe how the accident occurred.',
                'Present medical reports and bills as evidence of injury and expenses.',
                'Explain the impact of the accident on your client\'s life and livelihood.',
                'Reference relevant sections of the Motor Vehicles Act.'
            ]
        }
    },
];

export const VirtualCourtroom: React.FC<{ language: string }> = ({ language }) => {
    const [currentStep, setCurrentStep] = useState<'selection' | 'instructions' | 'simulation'>('selection');
    const [selectedScenario, setSelectedScenario] = useState<CourtroomScenario | null>(null);

    const handleSelectScenario = (scenario: CourtroomScenario) => {
        setSelectedScenario(scenario);
        setCurrentStep('instructions');
    };

    const handleEndSession = () => {
        setSelectedScenario(null);
        setCurrentStep('selection');
    };

    if (currentStep === 'selection') {
        return (
            <div className="p-4 md:p-8">
                 <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-2">Virtual Courtroom Simulator</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-8">Choose a scenario to build your confidence and practice your case in a realistic simulation.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {scenarios.map(s => (
                         <div key={s.key} className="bg-white dark:bg-brand-medium rounded-lg shadow-lg p-6 flex flex-col items-start border border-slate-200 dark:border-slate-700">
                             <div className="bg-brand-secondary text-white p-3 rounded-full mb-4">
                                <CourtroomIcon className="w-7 h-7" />
                             </div>
                             <h3 className="font-semibold text-xl text-brand-dark dark:text-white mb-2">{s.title}</h3>
                             <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-grow">{s.description}</p>
                             <button onClick={() => handleSelectScenario(s)} className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-sky-400 transition-colors mt-auto">
                                 Start Practice
                             </button>
                         </div>
                     ))}
                 </div>
            </div>
        );
    }

    if (currentStep === 'instructions' && selectedScenario) {
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-brand-medium p-6 rounded-lg shadow-lg border dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">Instructions for: {selectedScenario.title}</h2>
                    <div className="space-y-4 text-slate-700 dark:text-slate-300">
                        <div>
                            <h3 className="font-semibold text-lg mb-1 text-brand-dark dark:text-white">Your Role</h3>
                            <p>{selectedScenario.instructions.role}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-1 text-brand-dark dark:text-white">Your Objective</h3>
                            <p>{selectedScenario.instructions.objective}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1 text-brand-dark dark:text-white">Key Tips</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {selectedScenario.instructions.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                    </div>
                    <button onClick={() => setCurrentStep('simulation')} className="w-full mt-8 bg-green-500 text-white font-bold py-3 px-6 rounded-md hover:bg-green-600 transition-colors">
                        Begin Simulation
                    </button>
                </div>
            </div>
        );
    }
    
    if(currentStep === 'simulation' && selectedScenario) {
        return (
            <LiveCourtroomSession 
                scenario={selectedScenario}
                language={language}
                onEndSession={handleEndSession}
            />
        );
    }

    return null; // Fallback
};