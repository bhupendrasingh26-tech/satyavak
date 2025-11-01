import React, { useState, useEffect } from 'react';
import type { ExpertLocationResult } from '../../types';
import { findLegalAid, translateText } from '../../services/geminiService';
import { Spinner } from '../../components/Spinner';
import { StarIcon, PhoneIcon, MapPinIcon, RouteIcon, HistoryIcon } from '../../components/Icons';

const HISTORY_KEY = 'satyavak_locator_history';

const ResultCard: React.FC<{ result: ExpertLocationResult }> = ({ result }) => (
    <div className="bg-white dark:bg-brand-medium rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700 flex flex-col h-full">
        <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">{result.title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 flex-grow">{result.description}</p>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 border-t pt-4 mt-auto">
            <div className="flex items-center gap-3">
                <StarIcon className="w-5 h-5 text-amber-400" />
                <span>{result.rating > 0 ? `${result.rating.toFixed(1)} / 5.0` : 'No rating'}</span>
            </div>
            <div className="flex items-center gap-3">
                <RouteIcon className="w-5 h-5 text-sky-500" />
                <span>{result.distance}</span>
            </div>
            {result.contactNumber && (
                <div className="flex items-center gap-3">
                    <PhoneIcon className="w-5 h-5 text-green-500" />
                    <span>{result.contactNumber}</span>
                </div>
            )}
        </div>
        <a href={result.mapUri} target="_blank" rel="noopener noreferrer" className="mt-4 bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 text-sm">
            <MapPinIcon className="w-5 h-5"/>
            View on Map
        </a>
    </div>
);

export const ExpertLocator: React.FC<{ language: string }> = ({ language }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<ExpertLocationResult[] | null>(null);
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (err) => {
                console.warn("Geolocation permission denied.", err);
            }
        );

        try {
            const storedHistory = localStorage.getItem(HISTORY_KEY);
            if (storedHistory) {
                setSearchHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to load search history:", error);
        }
    }, []);

    useEffect(() => {
        if (searchHistory.length > 0) {
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory));
            } catch (error) {
                console.error("Failed to save search history:", error);
            }
        }
    }, [searchHistory]);

    const handleSearch = async (searchQuery: string) => {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) return;

        setQuery(trimmedQuery);
        setIsLoading(true);
        setError('');
        setResults(null);
        setHasSearched(true);
        
        try {
            const englishQuery = language === 'English' ? trimmedQuery : await translateText(trimmedQuery, 'English');
            const response = await findLegalAid(englishQuery, location);
            setResults(response);

            setSearchHistory(prev => {
                const lowerCaseQuery = trimmedQuery.toLowerCase();
                const filtered = prev.filter(item => item.toLowerCase() !== lowerCaseQuery);
                const updated = [trimmedQuery, ...filtered].slice(0, 5);
                return updated;
            });

        } catch (err: any) {
            console.error("Error finding legal aid:", err);
            const displayError = err.message ? err.message : "Sorry, something went wrong. Please try again.";
            setError(displayError);
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestedSearches = [
        "Family law advocates",
        "Public notaries",
        "Free legal aid for tenants",
        "District consumer court"
    ];

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center p-8">
                    <Spinner className="w-10 h-10 mx-auto text-brand-accent"/>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Finding experts near you...</p>
                </div>
            );
        }
        if (error) {
             return <p className="text-red-500 text-center">{error}</p>;
        }
        if (results && results.length > 0) {
            return (
                <div>
                    <h3 className="text-2xl font-semibold text-brand-dark dark:text-white mb-6">Search Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((res, i) => <ResultCard key={i} result={res} />)}
                    </div>
                </div>
            );
        }
        if (results) {
             return <p className="text-slate-600 dark:text-slate-400 text-center">No results found for your query.</p>;
        }
        return null;
    };


    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {!hasSearched ? (
                <div className="text-center py-16">
                    <h2 className="text-5xl font-bold text-brand-dark dark:text-white mb-4">Find Legal Experts Near You</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto">Whether you need a lawyer, a notary, or a free legal aid center, we're here to help you find the right support in your area.</p>
                    <div className="max-w-xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                                placeholder="e.g., 'need help with a property dispute'"
                                className="flex-1 w-full p-3 border rounded-full focus:ring-2 focus:ring-brand-accent focus:outline-none shadow-sm dark:bg-brand-medium dark:text-white dark:border-slate-600"
                            />
                            <button onClick={() => handleSearch(query)} disabled={isLoading} className="bg-brand-accent text-white font-bold py-3 px-6 rounded-full hover:bg-sky-400 disabled:bg-slate-300">
                                Search
                            </button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                           {suggestedSearches.map(s => (
                               <button key={s} onClick={() => handleSearch(s)} className="text-sm bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
                                   {s}
                               </button>
                           ))}
                        </div>
                        {searchHistory.length > 0 && (
                            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="text-md font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center justify-center gap-2">
                                    <HistoryIcon className="w-5 h-5"/>
                                    Recent Searches
                                </h4>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {searchHistory.map(s => (
                                        <button key={s} onClick={() => handleSearch(s)} className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full hover:bg-indigo-200 transition-colors dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-2">Expert Locator</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Describe your legal issue to find nearby help.</p>
                    <div className="flex items-center gap-2 mb-8">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="e.g., 'need help with a property dispute'"
                            className="flex-1 w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none dark:bg-brand-medium dark:text-white dark:border-slate-600"
                        />
                        <button onClick={() => handleSearch(query)} disabled={isLoading} className="bg-brand-accent text-white font-bold py-3 px-6 rounded-md hover:bg-sky-400 disabled:bg-slate-300 flex items-center justify-center">
                            {isLoading ? <Spinner className="w-5 h-5"/> : 'Search'}
                        </button>
                    </div>
                    {renderContent()}
                </>
            )}
        </div>
    );
};