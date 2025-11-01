import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { getTextToSpeech, translateText } from '../services/geminiService';
import { LANGUAGE_MAP } from '../constants';
import { decode, decodeAudioData } from '../utils/audio';
import { BotIcon, UserIcon, MicrophoneIcon, VolumeIcon, TranslateIcon, CopyIcon, ShareIcon, StopIcon } from './Icons';
import { Spinner } from './Spinner';

interface ChatUIProps {
    chatTitle: string;
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (englishMessage: string) => Promise<void>;
    language: string;
    onShareChat: () => void;
}

export const ChatUI: React.FC<ChatUIProps> = ({ chatTitle, messages, isLoading, onSendMessage, language, onShareChat }) => {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<{ source: AudioBufferSourceNode; index: number } | null>(null);
    const [showOriginal, setShowOriginal] = useState<Record<number, boolean>>({});
    const [copied, setCopied] = useState<Record<number, boolean>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const originalInput = input;
        setInput('');
        
        try {
            const englishInput = language === 'English' ? originalInput : await translateText(originalInput, 'English');
            await onSendMessage(englishInput);
        } catch (error) {
            console.error("Error sending message:", error);
            // Error display is handled by the parent component
        }
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };
    
    const playAudio = async (text: string, index: number) => {
        // Stop any currently playing audio.
        if (nowPlaying) {
            nowPlaying.source.stop();
        }
    
        // If the action was to stop the currently playing audio, we're done.
        if (nowPlaying && nowPlaying.index === index) {
            return;
        }
        
        // Setup to play new audio
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        
        try {
            const audioData = await getTextToSpeech(text);
            if(audioData) {
                const decodedData = decode(audioData);
                const audioBuffer = await decodeAudioData(decodedData, audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.onended = () => {
                    setNowPlaying(current => (current?.source === source ? null : current));
                };
                source.start();
                setNowPlaying({ source, index });
            }
        } catch (error) {
            console.error("Error playing audio:", error);
            setNowPlaying(null);
        }
    };

    const toggleTranslation = (index: number) => {
        setShowOriginal(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopied({ [index]: true });
        setTimeout(() => setCopied({ [index]: false }), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900">
            <div className="p-4 border-b bg-white dark:bg-brand-medium flex justify-between items-center">
                <h2 className="text-xl font-semibold text-brand-dark dark:text-white">{chatTitle}</h2>
                {messages.length > 0 && (
                    <button onClick={onShareChat} className="text-slate-500 hover:text-brand-dark dark:text-slate-400 dark:hover:text-white" aria-label="Share chat">
                        <ShareIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>

            {messages.length === 0 && !isLoading ? (
                 <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                    <h1 className="text-5xl font-bold text-brand-dark dark:text-white opacity-10">Satyavāk</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Your AI Legal Assistant</p>
                 </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <BotIcon className="w-8 h-8 text-brand-secondary flex-shrink-0 mt-1" />}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-accent text-white' : 'bg-white dark:bg-brand-medium text-brand-dark dark:text-white shadow-sm'}`}>
                               <p className="whitespace-pre-wrap">{showOriginal[index] ? msg.englishText : msg.text}</p>
                               {msg.role === 'model' && (
                                    <div className="flex items-center space-x-3 mt-2">
                                        <button onClick={() => playAudio(showOriginal[index] ? msg.englishText : msg.text, index)} className="text-slate-500 hover:text-brand-dark dark:text-slate-400 dark:hover:text-white" aria-label={nowPlaying?.index === index ? 'Stop audio' : 'Play audio'}>
                                            {nowPlaying?.index === index ? <StopIcon className="w-5 h-5" /> : <VolumeIcon className="w-5 h-5"/>}
                                        </button>
                                        <button onClick={() => handleCopy(showOriginal[index] ? msg.englishText : msg.text, index)} className="text-slate-500 hover:text-brand-dark dark:text-slate-400 dark:hover:text-white" aria-label="Copy text">
                                            {copied[index] ? <span className="text-xs font-semibold">Copied!</span> : <CopyIcon className="w-5 h-5"/>}
                                        </button>
                                        {language !== 'English' && msg.englishText !== msg.text && (
                                             <button onClick={() => toggleTranslation(index)} className="text-slate-500 hover:text-brand-dark dark:text-slate-400 dark:hover:text-white" aria-label="Toggle translation">
                                                <TranslateIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </div>
                               )}
                            </div>
                            {msg.role === 'user' && <UserIcon className="w-8 h-8 text-slate-500 flex-shrink-0 mt-1" />}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                             <BotIcon className="w-8 h-8 text-brand-secondary flex-shrink-0 mt-1" />
                             <div className="max-w-xl p-3 rounded-lg bg-white dark:bg-brand-medium text-brand-dark dark:text-white shadow-sm flex items-center">
                                <Spinner className="w-5 h-5 mr-2 text-brand-secondary"/> Thinking...
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
            
            <div className="p-4 bg-white dark:bg-brand-medium border-t">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 p-3 border rounded-full focus:ring-2 focus:ring-brand-accent focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600"
                        disabled={isLoading}
                    />
                    <button onClick={handleVoiceInput} className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-brand-dark dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'}`}>
                       <MicrophoneIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-brand-accent text-white font-bold py-3 px-5 rounded-full hover:bg-sky-400 disabled:bg-slate-300">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};