import React, { useState } from 'react';
import { generateDocument, translateText } from '../../services/geminiService';
import { LANGUAGE_MAP } from '../../constants';
import type { GeneratedDocument } from '../../types';
import { Spinner } from '../../components/Spinner';
import { DocumentIcon } from '../../components/Icons';

// The html-to-docx library is loaded via a script tag in index.html and attaches itself to the window object.

interface DocumentGeneratorProps {
    language: string;
    onSaveDocument: (doc: GeneratedDocument) => void;
}

const documentTypes: { [key: string]: { label: string; fields: { name: string; label: string; placeholder: string }[] } } = {
    'rental-agreement': {
        label: 'Rental Agreement',
        fields: [
            { name: 'landlordName', label: 'Landlord Full Name', placeholder: 'e.g., Ramesh Kumar' },
            { name: 'tenantName', label: 'Tenant Full Name', placeholder: 'e.g., Priya Singh' },
            { name: 'propertyAddress', label: 'Full Property Address', placeholder: 'e.g., 123, ABC Apartments, Sector 4, New Delhi' },
            { name: 'rentAmount', label: 'Monthly Rent (INR)', placeholder: 'e.g., 25000' },
            { name: 'securityDeposit', label: 'Security Deposit (INR)', placeholder: 'e.g., 50000' },
            { name: 'leaseTerm', label: 'Lease Term (in months)', placeholder: 'e.g., 11' },
            { name: 'startDate', label: 'Lease Start Date', placeholder: 'DD-MM-YYYY' },
        ],
    },
    'nda': {
        label: 'Non-Disclosure Agreement (NDA)',
        fields: [
            { name: 'disclosingParty', label: 'Disclosing Party', placeholder: 'e.g., Innovate Pvt. Ltd.' },
            { name: 'receivingParty', label: 'Receiving Party', placeholder: 'e.g., John Doe' },
            { name: 'effectiveDate', label: 'Effective Date', placeholder: 'DD-MM-YYYY' },
            { name: 'purpose', label: 'Purpose of Disclosure', placeholder: 'e.g., To evaluate a potential business relationship' },
            { name: 'term', label: 'Term of Agreement (in years)', placeholder: 'e.g., 3' },
        ],
    },
    'legal-notice': {
        label: 'Legal Notice',
        fields: [
            { name: 'senderName', label: 'Sender Full Name', placeholder: 'e.g., Vikram Singh' },
            { name: 'senderAddress', label: 'Sender Full Address', placeholder: 'e.g., 45, Civil Lines, Jaipur' },
            { name: 'recipientName', label: 'Recipient Full Name', placeholder: 'e.g., XYZ Corporation' },
            { name: 'recipientAddress', label: 'Recipient Full Address', placeholder: 'e.g., 789, Business Tower, Mumbai' },
            { name: 'subject', label: 'Subject of the Notice', placeholder: 'e.g., Regarding non-payment of dues' },
            { name: 'grievanceDetails', label: 'Detailed Grievance', placeholder: 'Describe the issue, dates, and amounts involved.' },
            { name: 'remedySought', label: 'Remedy/Action Required', placeholder: 'e.g., Payment of Rs. 50,000 within 15 days' },
        ],
    },
};

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ language, onSaveDocument }) => {
    const [step, setStep] = useState(1);
    const [docTypeKey, setDocTypeKey] = useState('');
    const [details, setDetails] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [generatedDoc, setGeneratedDoc] = useState('');
    const [error, setError] = useState('');

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedDoc('');
        setError('');
        
        try {
            const docLabel = documentTypes[docTypeKey].label;
            const englishDocType = language === 'English' ? docLabel : await translateText(docLabel, 'English');
            
            const englishDetails: Record<string, string> = {};
            for (const key in details) {
                englishDetails[key] = language === 'English' ? details[key] : await translateText(details[key], 'English');
            }

            const response = await generateDocument(englishDocType, englishDetails);
            const englishDocHtml = response.text.replace(/```html\n?/, '').replace(/```$/, '');
            
            const translatedDoc = language === 'English' ? englishDocHtml : await translateText(englishDocHtml, LANGUAGE_MAP[language]);
            setGeneratedDoc(translatedDoc);

            const newDocument: GeneratedDocument = {
                id: Date.now().toString(),
                docType: docLabel,
                createdAt: new Date().toISOString(),
                content: translatedDoc,
            };
            onSaveDocument(newDocument);
            setStep(3);

        } catch (err) {
            console.error("Error generating document:", err);
            setError("Failed to generate document. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = async () => {
        try {
            const fileBuffer = await (window as any).htmlToDocx(generatedDoc, null, {
                footer: true,
                pageNumber: true,
            });
            const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${documentTypes[docTypeKey].label.replace(/\s/g, '_')}_${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Error creating .docx file:", e);
            alert("Could not create .docx file. An error occurred.");
        }
    };

    const startOver = () => {
        setStep(1);
        setDocTypeKey('');
        setDetails({});
        setGeneratedDoc('');
        setError('');
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-brand-dark dark:text-white mb-4">Step 1: Select Document Type</h3>
                        <select
                            value={docTypeKey}
                            onChange={(e) => {
                                setDocTypeKey(e.target.value);
                                setDetails({});
                            }}
                            className="w-full p-3 border border-slate-300 rounded-md focus:ring-brand-accent focus:border-brand-accent dark:bg-slate-800 dark:text-white dark:border-slate-600"
                        >
                            <option value="">-- Choose a document --</option>
                            {Object.entries(documentTypes).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <button onClick={() => setStep(2)} disabled={!docTypeKey} className="mt-6 w-full bg-brand-accent text-white font-bold py-3 px-6 rounded-md hover:bg-sky-400 disabled:bg-slate-300">
                            Next: Add Details
                        </button>
                    </div>
                );
            case 2:
                const selectedDoc = documentTypes[docTypeKey];
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-brand-dark dark:text-white mb-4">Step 2: Fill in Details for {selectedDoc.label}</h3>
                        <div className="space-y-4">
                            {selectedDoc.fields.map(field => (
                                <div key={field.name}>
                                    <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
                                    <input id={field.name} name={field.name} value={details[field.name] || ''} onChange={handleDetailChange} type="text" placeholder={field.placeholder} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent dark:bg-slate-800 dark:text-white dark:border-slate-600"/>
                                </div>
                            ))}
                        </div>
                         <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep(1)} className="w-1/2 bg-slate-200 dark:bg-slate-600 text-brand-dark dark:text-white font-bold py-3 px-6 rounded-md hover:bg-slate-300">
                                Back
                            </button>
                            <button onClick={handleGenerate} disabled={isLoading} className="w-1/2 bg-brand-accent text-white font-bold py-3 px-6 rounded-md hover:bg-sky-400 disabled:bg-slate-300 flex items-center justify-center">
                                {isLoading ? <Spinner/> : 'Generate Document'}
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                     <div>
                        <h3 className="text-2xl font-semibold text-brand-dark dark:text-white mb-4">Step 3: Your Document is Ready</h3>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border dark:border-slate-700 max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: generatedDoc }} />
                        <div className="flex gap-4 mt-6">
                            <button onClick={startOver} className="w-1/2 bg-slate-200 dark:bg-slate-600 text-brand-dark dark:text-white font-bold py-3 px-6 rounded-md hover:bg-slate-300">
                                Generate Another
                            </button>
                            <button onClick={handleDownload} className="w-1/2 bg-green-500 text-white font-bold py-3 px-6 rounded-md hover:bg-green-600 flex items-center justify-center gap-2">
                                <DocumentIcon className="w-5 h-5"/> Download as .docx
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">Disclaimer: This is an AI-generated draft for informational purposes only and should be reviewed by a qualified legal professional. Your document has been saved to your profile.</p>
                    </div>
                )
            default:
                return null;
        }
    }
    
    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-2">Document Generator</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Create professional legal documents in a few simple steps.</p>
            <div className="bg-white dark:bg-brand-medium p-6 rounded-lg shadow-md">
                {renderStep()}
            </div>
        </div>
    );
};