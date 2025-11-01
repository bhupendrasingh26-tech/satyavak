import React from 'react';
import type { User } from '../../types';

declare const Razorpay: any;

interface PremiumSubscriptionProps {
    user: User;
    onUpgrade: () => void;
}

export const PremiumSubscription: React.FC<PremiumSubscriptionProps> = ({ user, onUpgrade }) => {

    const handlePayment = () => {
        const options = {
            key: 'rzp_test_xxxxxxxxxxxxxx', // This is a test key
            amount: '49900', // Amount in paise (e.g., 499.00 INR)
            currency: 'INR',
            name: 'Satyavāk Premium',
            description: 'Lifetime Access',
            image: 'https://api.dicebear.com/8.x/icons/svg?seed=Satyavak',
            handler: function (response: any) {
                // This is a mock handler. In a real app, you would verify
                // the payment signature on your backend before upgrading the user.
                alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
                onUpgrade();
            },
            prefill: {
                name: user.name,
                email: user.email,
            },
            notes: {
                address: 'Satyavāk Corporate Office'
            },
            theme: {
                color: '#38BDF8'
            }
        };
        const rzp = new Razorpay(options);
        rzp.open();
    };


    const premiumFeatures = [
        "Unlimited Document Generation",
        "Download Documents in .docx Format",
        "Save and Manage Documents in Profile",
        "Priority Access to New Features",
        "Enhanced AI Model for Generation"
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-brand-dark">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-4xl font-extrabold text-brand-dark dark:text-white mb-4">Go Premium</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">Unlock the full power of Satyavāk with a one-time payment for lifetime access.</p>
                
                <div className="bg-white dark:bg-brand-medium rounded-lg shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-2xl font-bold text-brand-dark dark:text-white">Lifetime Plan</h3>
                    <p className="my-4">
                        <span className="text-5xl font-bold text-brand-dark dark:text-white">₹499</span>
                        <span className="text-slate-500 dark:text-slate-400">/ one-time</span>
                    </p>
                    <ul className="space-y-3 text-left my-8">
                        {premiumFeatures.map(feature => (
                             <li key={feature} className="flex items-center">
                                <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handlePayment}
                        className="w-full bg-brand-secondary text-white font-bold py-4 px-6 rounded-md hover:bg-indigo-500 transition-colors text-lg"
                    >
                        Upgrade Now & Pay with Razorpay
                    </button>
                </div>
                 <p className="text-xs text-slate-400 mt-4">Note: This is a demonstration using Razorpay's test mode. No real payment will be processed.</p>
            </div>
        </div>
    );
};