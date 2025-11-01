import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { getTextToSpeech } from '../../services/geminiService';
import { decode, decodeAudioData, encode } from '../../utils/audio';
import { Spinner } from '../../components/Spinner';
import { MicrophoneIcon, StopIcon } from '../../components/Icons';
import type { CourtroomScenario } from './VirtualCourtroom';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

type SessionStatus = 'initializing' | 'starting' | 'active' | 'speaking' | 'listening' | 'ended' | 'error';
type Transcript = { speaker: 'Judge' | 'You'; text: string };

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const StatusIndicator: React.FC<{ status: SessionStatus }> = ({ status }) => {
    let text = '';
    let color = 'text-slate-500 dark:text-slate-400';
    switch (status) {
        case 'initializing': text = 'Preparing the courtroom...'; break;
        case 'starting': text = 'Connecting to the session...'; break;
        case 'listening': text = 'Listening...'; color = 'text-green-500'; break;
        case 'speaking': text = 'Judge is speaking...'; color = 'text-sky-500'; break;
        case 'ended': text = 'Session has ended.'; break;
        case 'error': text = 'An error occurred.'; color = 'text-red-500'; break;
    }

    return (
        <div className="flex items-center justify-center p-2 rounded-full bg-slate-100 dark:bg-slate-700">
            { (status === 'listening' || status === 'speaking' || status === 'starting') && <Spinner className="w-4 h-4 mr-2" /> }
            <p className={`font-semibold text-sm ${color}`}>{text}</p>
        </div>
    );
};

export const LiveCourtroomSession: React.FC<{ scenario: CourtroomScenario, language: string, onEndSession: () => void }> = ({ scenario, onEndSession }) => {
    const [status, setStatus] = useState<SessionStatus>('initializing');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [currentUserInput, setCurrentUserInput] = useState('');
    const [currentJudgeOutput, setCurrentJudgeOutput] = useState('');
    const [error, setError] = useState('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext>();
    const scriptProcessorRef = useRef<ScriptProcessorNode>();
    const mediaStreamRef = useRef<MediaStream>();
    const outputAudioContextRef = useRef<AudioContext>();
    const nextStartTimeRef = useRef(0);
    const outputSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const currentUserInputRef = useRef('');
    const currentJudgeOutputRef = useRef('');

    useEffect(() => {
        // Fix: Refactor callback functions to be const arrow functions. This can resolve subtle scoping issues and is a more common pattern within useEffect.
        const onopen = async () => {
            try {
                mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob: Blob = {
                        data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                        mimeType: 'audio/pcm;rate=16000',
                    };
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(audioContextRef.current.destination);
                setStatus('listening');

            } catch (err) {
                console.error("Microphone access denied or error:", err);
                setError("Microphone access is required. Please grant permission and try again.");
                setStatus('error');
            }
        };

        const onmessage = async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                currentUserInputRef.current += message.serverContent.inputTranscription.text;
                setCurrentUserInput(currentUserInputRef.current);
            }
            if (message.serverContent?.outputTranscription) {
                currentJudgeOutputRef.current += message.serverContent.outputTranscription.text;
                setCurrentJudgeOutput(currentJudgeOutputRef.current);
            }
            if (message.serverContent?.turnComplete) {
                const userInput = currentUserInputRef.current;
                const judgeOutput = currentJudgeOutputRef.current;
                setTranscripts(prev => {
                    const newTranscripts = [...prev];
                    if (userInput.trim()) newTranscripts.push({ speaker: 'You', text: userInput.trim() });
                    if (judgeOutput.trim()) newTranscripts.push({ speaker: 'Judge', text: judgeOutput.trim() });
                    return newTranscripts;
                });
                currentUserInputRef.current = '';
                currentJudgeOutputRef.current = '';
                setCurrentUserInput('');
                setCurrentJudgeOutput('');
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                setStatus('speaking');
                const audioContext = outputAudioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.addEventListener('ended', () => {
                    outputSourcesRef.current.delete(source);
                    if (outputSourcesRef.current.size === 0) {
                        setStatus('listening');
                    }
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                outputSourcesRef.current.add(source);
            }
        };

        const onerror = (e: ErrorEvent) => {
            console.error("Live session error:", e);
            setError("A connection error occurred.");
            setStatus('error');
        };

        const onclose = (e: CloseEvent) => {
             // Status is handled by the end session button
        };
        
        async function startLiveSession() {
            setStatus('starting');
            try {
                const systemInstruction = `You are a judge in a simulated Indian courtroom. The user is practicing for a trial based on the following scenario: ${scenario.title}. Your opening statement has already been delivered ("Let's begin with the hearing."). The user will now present their opening statement. Listen to them, then ask relevant questions as a judge would. Evaluate their responses based on clarity and relevance. Maintain your persona as a judge throughout.`;

                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        systemInstruction,
                        responseModalities: [Modality.AUDIO],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                    },
                    callbacks: { onopen, onmessage, onerror, onclose }
                });

                await sessionPromiseRef.current;
            } catch (err) {
                console.error("Error starting live session", err);
                setError("Failed to connect to live session.");
                setStatus('error');
            }
        }

        async function playOpeningStatement() {
            try {
                const audioData = await getTextToSpeech("Let's begin with the hearing.");
                if (audioData) {
                    if (!outputAudioContextRef.current) {
                        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    }
                    const audioContext = outputAudioContextRef.current;
                    const decodedData = decode(audioData);
                    const audioBuffer = await decodeAudioData(decodedData, audioContext, 24000, 1);
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);
                    source.onended = () => startLiveSession();
                    source.start();
                } else {
                    startLiveSession();
                }
            } catch (err) {
                console.error("Error playing opening statement:", err);
                setError("Failed to start the session. Please try again.");
                setStatus('error');
            }
        }

        playOpeningStatement();

        return () => {
           cleanUp();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cleanUp = () => {
        sessionPromiseRef.current?.then(session => session.close());
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }

        outputSourcesRef.current.forEach(source => source.stop());
        
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
    }

    const handleEndSession = () => {
        cleanUp();
        setStatus('ended');
        setTimeout(onEndSession, 1000); // Give user time to see the ended message
    };


    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-brand-dark">
            <div className="p-4 border-b bg-white dark:bg-brand-medium text-center">
                <h2 className="text-xl font-semibold text-brand-dark dark:text-white">{scenario.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Live Voice Simulation</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {transcripts.map((t, i) => (
                    <div key={i} className={`flex items-start gap-3 ${t.speaker === 'You' ? 'justify-end' : ''}`}>
                        {t.speaker === 'Judge' && <div className="font-bold text-brand-secondary flex-shrink-0 mt-1">Judge:</div>}
                        <div className={`max-w-xl p-3 rounded-lg ${t.speaker === 'You' ? 'bg-brand-accent text-white' : 'bg-white dark:bg-brand-medium text-brand-dark dark:text-white shadow-sm'}`}>
                           <p>{t.text}</p>
                        </div>
                        {t.speaker === 'You' && <div className="font-bold text-slate-600 dark:text-slate-300 flex-shrink-0 mt-1">You:</div>}
                    </div>
                ))}
                {currentUserInput && <p className="text-slate-500 dark:text-slate-400 italic text-right">You: {currentUserInput}...</p>}
                {currentJudgeOutput && <p className="text-slate-500 dark:text-slate-400 italic text-left">Judge: {currentJudgeOutput}...</p>}
                 {status === 'error' && <p className="text-red-500 text-center font-semibold p-4">{error}</p>}
            </div>

            <div className="p-4 bg-white dark:bg-brand-medium border-t flex flex-col items-center justify-center space-y-4">
                <StatusIndicator status={status} />
                <div className={`p-4 rounded-full transition-colors ${status === 'listening' ? 'bg-green-500/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <MicrophoneIcon className={`w-10 h-10 ${status === 'listening' ? 'text-green-600 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`} />
                </div>
                 <button onClick={handleEndSession} className="bg-red-500 text-white font-bold py-2 px-6 rounded-full hover:bg-red-600 disabled:bg-slate-300 flex items-center gap-2">
                    <StopIcon className="w-5 h-5"/>
                    End Session
                </button>
            </div>
        </div>
    );
};
