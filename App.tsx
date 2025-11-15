import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, FunctionCall } from '@google/genai';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

import { MOCK_CONTACTS } from './mockData';
import { View, Contact, Confirmation, Reminder, MediaItem, Transcription, MediaCommand, CaptureMode, AnalysisResult } from './types';

import Toolbar from './components/Toolbar';
import ContactsView from './components/ContactsView';
import MediaView from './components/MediaView';
import CalendarView from './components/CalendarView';
import AnalysisView from './components/AnalysisView';
import CommandsList from './components/CommandsList';
import AiAssistantView from './components/AiAssistantView';
import ApiKeySetup from './components/ApiKeySetup';

const commandParsingModel = 'gemini-2.5-flash';

function App() {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));

    // Initialize AI client when API key is available
    useEffect(() => {
        if (apiKey) {
            try {
                const genAi = new GoogleGenAI({ apiKey });
                setAi(genAi);
            } catch (e) {
                console.error("Failed to initialize GoogleGenAI:", e);
                // Handle invalid key case
                localStorage.removeItem('gemini-api-key');
                setApiKey(null);
                alert("The saved API Key appears to be invalid. Please enter it again.");
            }
        }
    }, [apiKey]);

    const handleKeySubmit = (key: string) => {
        localStorage.setItem('gemini-api-key', key);
        setApiKey(key);
    };


    // View Management
    const [activeView, setActiveView] = useState<View>(View.COMMANDS);

    // Data Management
    const [contacts, setContacts] = useState<Contact[]>(() => {
        const saved = localStorage.getItem('contacts');
        return saved ? JSON.parse(saved) : [];
    });
    const [reminders, setReminders] = useState<Reminder[]>(() => {
        const saved = localStorage.getItem('reminders');
        return saved ? JSON.parse(saved) : [];
    });
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [confirmations, setConfirmations] = useState<Confirmation[]>(() => {
        const saved = localStorage.getItem('confirmations');
        const parsed = saved ? JSON.parse(saved) : [];
        return parsed.map((c: any) => ({...c, timestamp: new Date(c.timestamp)})); // ensure date object
    });
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    // State for UI interaction and forms
    const [isRecordingMedia, setIsRecordingMedia] = useState(false);
    const [captureMode, setCaptureMode] = useState<CaptureMode>(CaptureMode.GENERAL);
    const [newContactData, setNewContactData] = useState<Partial<Contact>>({});
    const [newConfirmationData, setNewConfirmationData] = useState<Partial<Confirmation>>({});
    const [activeContactQuery, setActiveContactQuery] = useState<string | null>(null);
    const [mediaCommand, setMediaCommand] = useState<MediaCommand | null>(null);

    const { transcript, startListening, stopListening, isListening, error: speechError } = useSpeechRecognition();

    useEffect(() => {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }, [contacts]);

    useEffect(() => {
        localStorage.setItem('confirmations', JSON.stringify(confirmations));
    }, [confirmations]);
    
    useEffect(() => {
        localStorage.setItem('reminders', JSON.stringify(reminders));
    }, [reminders]);


    const addTranscription = useCallback((text: string, type: 'user' | 'system' | 'model') => {
        if (!text.trim()) return;
        const newTranscription: Transcription = {
            id: Date.now().toString(),
            text,
            timestamp: new Date(),
            type,
        };
        setTranscriptions(prev => [...prev, newTranscription]);
    }, []);

    useEffect(() => {
        if (speechError) {
            addTranscription(`Speech recognition error: ${speechError}`, 'system');
        }
    }, [speechError, addTranscription]);
    
    const commandTools: FunctionDeclaration[] = useMemo(() => [
        {
            name: 'openView',
            description: 'Opens a specific view or panel in the application.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    view: { type: Type.STRING, description: 'The name of the view to open. Can be "contacts", "media", "calendar", "analysis", "commands", or "assistant".' }
                },
                required: ['view']
            }
        },
        {
            name: 'closeView',
            description: 'Closes the currently active view or panel.',
            parameters: { type: Type.OBJECT, properties: {} }
        },
        {
            name: 'loadContacts',
            description: 'Loads a predefined list of mock contacts into the contacts view.',
            parameters: { type: Type.OBJECT, properties: {} }
        },
        {
            name: 'findContact',
            description: 'Finds and displays the details of a specific contact by name or number.',
            parameters: {
                type: Type.OBJECT, properties: {
                    query: { type: Type.STRING, description: 'The name or index number of the contact to find (e.g., "Jane Doe" or "contact 1").' }
                }, required: ['query']
            }
        },
        {
            name: 'captureContact',
            description: 'Starts the process of capturing a new contact and pre-fills data if provided.',
            parameters: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    email: { type: Type.STRING },
                    details: { type: Type.STRING }
                }
            }
        },
        {
            name: 'captureConfirmation',
            description: 'Starts the process of capturing a new confirmation number and pre-fills data.',
            parameters: {
                type: Type.OBJECT, properties: {
                    type: { type: Type.STRING, description: 'The type of confirmation, e.g., "hotel", "flight", "order".' },
                    name: { type: Type.STRING, description: 'The name associated with the confirmation.' },
                    number: { type: Type.STRING, description: 'The confirmation number or code.' }
                }
            }
        },
        {
            name: 'saveCapture',
            description: 'Saves the currently captured contact or confirmation.',
            parameters: { type: Type.OBJECT, properties: {} }
        },
        {
            name: 'cancelCapture',
            description: 'Cancels the current contact or confirmation capture process.',
            parameters: { type: Type.OBJECT, properties: {} }
        },
        {
            name: 'mediaAction',
            description: 'Controls the media capture view for taking photos or recording videos and audio.',
            parameters: {
                type: Type.OBJECT, properties: {
                    action: { type: Type.STRING, description: 'The action to perform: "take-photo", "take-photos", "take-photo-timer", "record-video", "record-audio", "stop-recording", "stop-audio-recording", "switch-camera".' },
                    count: { type: Type.NUMBER, description: 'The number of photos to take for the "take-photos" action.' },
                    duration: { type: Type.NUMBER, description: 'Duration in seconds for a timer ("take-photo-timer", "take-photos") or recording ("record-video").' }
                }, required: ['action']
            }
        },
        {
            name: 'addReminder',
            description: 'Adds a new reminder to the calendar.',
            parameters: {
                type: Type.OBJECT, properties: {
                    text: { type: Type.STRING, description: 'The content of the reminder.' }
                }, required: ['text']
            }
        },
        {
            name: 'clearTranscription',
            description: 'Clears the entire transcription log.',
            parameters: { type: Type.OBJECT, properties: {} }
        }
    ], []);

    const handleFunctionCall = useCallback((fc: FunctionCall) => {
        const { name, args } = fc;
        console.log('Executing function call:', name, args);
        switch (name) {
            case 'openView':
                const viewMap: { [key: string]: View } = {
                    'contacts': View.CONTACTS,
                    'media': View.MEDIA,
                    'calendar': View.CALENDAR,
                    'analysis': View.ANALYSIS,
                    'commands': View.COMMANDS,
                    'assistant': View.AI_ASSISTANT,
                };
                if (args.view && viewMap[args.view as string]) {
                    setActiveView(viewMap[args.view as string]);
                }
                break;
            case 'closeView':
                setActiveView(View.NONE);
                break;
            case 'loadContacts':
                setContacts(MOCK_CONTACTS);
                addTranscription('Loaded mock contacts.', 'system');
                break;
            case 'findContact':
                if (args.query) {
                    setActiveView(View.CONTACTS);
                    setActiveContactQuery(args.query as string);
                }
                break;
            case 'captureContact':
                setActiveView(View.CONTACTS);
                setCaptureMode(CaptureMode.CONTACT);
                setNewContactData({ name: args.name as string, phone: args.phone as string, email: args.email as string, details: args.details as string });
                break;
            case 'captureConfirmation':
                setActiveView(View.CONTACTS);
                setCaptureMode(CaptureMode.CONFIRMATION);
                setNewConfirmationData({ type: args.type as string, name: args.name as string, number: args.number as string });
                break;
            case 'saveCapture':
                if (captureMode === CaptureMode.CONTACT) handleSaveContact();
                else if (captureMode === CaptureMode.CONFIRMATION) handleSaveConfirmation();
                break;
            case 'cancelCapture':
                if (captureMode === CaptureMode.CONTACT) handleCancelContact();
                else if (captureMode === CaptureMode.CONFIRMATION) handleCancelConfirmation();
                break;
            case 'mediaAction':
                setActiveView(View.MEDIA);
                const action = args.action as string;
                const durationInSeconds = args.duration ? Number(args.duration) : undefined;
                
                if (action === 'take-photo') {
                    setMediaCommand({ type: 'take-photos', count: 1 });
                } else if (action === 'take-photo-timer') {
                    setMediaCommand({ type: 'take-photo-timer', duration: durationInSeconds || 5 });
                } else if (action === 'take-photos') {
                    setMediaCommand({ type: 'take-photos', count: Number(args.count) || 1, timer: durationInSeconds });
                } else if (action === 'record-video') {
                    const durationInMs = durationInSeconds ? durationInSeconds * 1000 : undefined;
                    setMediaCommand({ type: 'record-video', duration: durationInMs });
                } else if (action === 'record-audio') {
                    setMediaCommand({ type: 'record-audio' });
                } else if (action === 'stop-recording') {
                    setMediaCommand({ type: 'stop-recording' });
                } else if (action === 'stop-audio-recording') {
                    setMediaCommand({ type: 'stop-audio-recording' });
                } else if (action === 'switch-camera') {
                    setMediaCommand({ type: 'switch-camera' });
                }
                break;
            case 'addReminder':
                if (args.text) {
                    const newReminder: Reminder = { id: Date.now().toString(), text: args.text as string, timestamp: new Date() };
                    setReminders(prev => [...prev, newReminder]);
                    addTranscription(`Reminder set: "${args.text}"`, 'system');
                }
                break;
            case 'clearTranscription':
                setTranscriptions([]);
                break;
            default:
                addTranscription(`Unknown command: ${name}`, 'system');
        }
    }, [captureMode]); // Dependencies will be added for handlers

    const processCommand = useCallback(async (text: string) => {
        if (!text || !ai) return;
        try {
            const response = await ai.models.generateContent({
                model: commandParsingModel,
                contents: [{ parts: [{ text: `Parse and execute the desired function call for the following user command: "${text}"` }] }],
                config: {
                    tools: [{ functionDeclarations: commandTools }]
                }
            });

            if (response.functionCalls && response.functionCalls.length > 0) {
                response.functionCalls.forEach(handleFunctionCall);
            } else {
                 if (response.text) {
                    addTranscription(response.text, 'model');
                 } else {
                    addTranscription("I'm not sure how to handle that. Try 'show commands'.", 'model');
                 }
            }
        } catch (e) {
            console.error("Error processing command with Gemini:", e);
            addTranscription("Sorry, I had trouble understanding that.", 'system');
        }
    }, [commandTools, handleFunctionCall, addTranscription, ai]);
    
    useEffect(() => {
        if (transcript) {
            addTranscription(transcript, 'user');
            processCommand(transcript);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript]);


    // Handler Functions
    const handleSaveContact = useCallback(() => {
        if (newContactData.name) {
            const newContact: Contact = {
                id: Date.now().toString(),
                name: newContactData.name,
                phone: newContactData.phone,
                email: newContactData.email,
                details: newContactData.details,
                status: 'offline', // default status
            };
            setContacts(prev => [...prev, newContact]);
            addTranscription(`Contact "${newContact.name}" saved.`, 'system');
            setCaptureMode(CaptureMode.GENERAL);
            setNewContactData({});
        } else {
            addTranscription('Cannot save contact without a name.', 'system');
        }
    }, [newContactData, addTranscription]);
    
    const handleCancelContact = useCallback(() => {
        setCaptureMode(CaptureMode.GENERAL);
        setNewContactData({});
        addTranscription('Contact capture cancelled.', 'system');
    }, [addTranscription]);

    const handleSaveConfirmation = useCallback(() => {
        if (newConfirmationData.number) {
            const newConf: Confirmation = {
                id: Date.now().toString(),
                timestamp: new Date(),
                type: newConfirmationData.type || 'General',
                name: newConfirmationData.name || 'N/A',
                number: newConfirmationData.number,
            };
            setConfirmations(prev => [...prev, newConf]);
            addTranscription(`Confirmation #${newConf.number} saved.`, 'system');
            setCaptureMode(CaptureMode.GENERAL);
            setNewConfirmationData({});
        }
    }, [newConfirmationData, addTranscription]);

    const handleCancelConfirmation = useCallback(() => {
        setCaptureMode(CaptureMode.GENERAL);
        setNewConfirmationData({});
        addTranscription('Confirmation capture cancelled.', 'system');
    }, [addTranscription]);

    const handleImportContacts = useCallback((imported: Omit<Contact, 'id' | 'status'>[]) => {
        const newContacts = imported.map(c => ({
            ...c,
            id: `imported-${Date.now()}-${Math.random()}`,
            status: 'offline' as const
        }));
        setContacts(prev => [...prev, ...newContacts]);
        addTranscription(`Imported ${newContacts.length} contacts.`, 'system');
    }, [addTranscription]);

    const handleCaptureMedia = useCallback((item: Omit<MediaItem, 'id'|'timestamp'>) => {
        const newMediaItem: MediaItem = {
            ...item,
            id: Date.now().toString(),
            timestamp: new Date(),
        };
        setMediaItems(prev => [...prev, newMediaItem]);
        addTranscription(`Captured new ${item.type}.`, 'system');
    }, [addTranscription]);

    const handleAnalyzeText = useCallback(async (text: string) => {
        setAnalysisResult(null); // Clear previous results
        if (!text.trim()) {
            return "Please enter some text to analyze.";
        }
        if (!ai) {
             return "AI client not initialized. Please check your API key.";
        }
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: `Analyze the following text and extract any contacts (name, phone, email), calendar events (description, date, time), and confirmation numbers (type, associated name, number). Text: "${text}"`}]}],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            contacts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        phone: { type: Type.STRING },
                                        email: { type: Type.STRING },
                                    }
                                }
                            },
                            events: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        description: { type: Type.STRING },
                                        date: { type: Type.STRING, description: "Date of the event, e.g., 'Tomorrow', 'Friday', '2024-08-15'" },
                                        time: { type: Type.STRING, description: "Time of the event, e.g., '3pm', '15:00'" },
                                    }
                                }
                            },
                            confirmations: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING, description: "e.g., 'Flight', 'Order', 'Hotel'" },
                                        name: { type: Type.STRING, description: "Name associated with the confirmation" },
                                        number: { type: Type.STRING, description: "The confirmation code" },
                                    }
                                }
                            }
                        }
                    }
                }
            });
            const resultJson = JSON.parse(response.text);
            setAnalysisResult(resultJson);
            return null; // success
        } catch (e) {
            console.error("Error analyzing text with Gemini:", e);
            return "Sorry, I had trouble analyzing that text. The structure might be too complex.";
        }
    }, [ai]);

    const handleAddExtractedContact = useCallback((contact: {name?: string, phone?: string, email?: string}) => {
        const newContact: Contact = {
            id: Date.now().toString(),
            name: contact.name || 'N/A',
            phone: contact.phone,
            email: contact.email,
            status: 'offline',
        };
        setContacts(prev => [...prev, newContact]);
        addTranscription(`Added contact "${newContact.name}" from analysis.`, 'system');
    }, [addTranscription]);

    const handleAddExtractedEvent = useCallback((event: {description?: string, date?: string, time?: string}) => {
        const reminderText = `${event.description || 'Event'}${event.date ? ` on ${event.date}` : ''}${event.time ? ` at ${event.time}` : ''}`;
        const newReminder: Reminder = {
            id: Date.now().toString(),
            text: reminderText,
            timestamp: new Date()
        };
        setReminders(prev => [...prev, newReminder]);
        addTranscription(`Added reminder "${reminderText}" from analysis.`, 'system');
    }, [addTranscription]);

    const handleAddExtractedConfirmation = useCallback((conf: {type?: string, name?: string, number?: string}) => {
        const newConf: Confirmation = {
            id: Date.now().toString(),
            timestamp: new Date(),
            type: conf.type || 'General',
            name: conf.name || 'N/A',
            number: conf.number || 'Unknown',
        };
        setConfirmations(prev => [...prev, newConf]);
        addTranscription(`Added confirmation #${newConf.number} from analysis.`, 'system');
    }, [addTranscription]);


    if (!ai) {
        return <ApiKeySetup onKeySubmit={handleKeySubmit} />;
    }

    return (
        <div className="bg-slate-900 min-h-screen font-sans text-white">
            <Toolbar
                activeView={activeView}
                setActiveView={setActiveView}
                isListening={isListening}
                isRecording={isRecordingMedia}
                startListening={startListening}
                stopListening={stopListening}
            />
            <main className="relative md:ml-20 h-screen overflow-y-auto pb-20 md:pb-0">
                {activeView === View.NONE && (
                    <div className="p-4 md:p-8">
                        <h1 className="text-3xl font-light mb-2">AI Voice Assistant</h1>
                        <p className="text-slate-400">Use your voice to control the interface. Say "show commands" to get started.</p>
                         <div className="mt-8 p-6 bg-slate-800/50 rounded-lg">
                             <h2 className="text-xl font-bold text-teal-400 mb-4">Listening Status</h2>
                             <div className="flex items-center gap-4">
                                 <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}>
                                     <i className="fas fa-microphone"></i>
                                 </div>
                                 <div>
                                    <p className={`text-2xl font-semibold ${isListening ? 'text-red-400' : 'text-slate-400'}`}>{isListening ? 'Listening...' : 'Not Listening'}</p>
                                    <p className="text-slate-500">Last command: <code className="bg-slate-700 rounded px-2 py-1">{transcript || '...'}</code></p>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

                <ContactsView
                    show={activeView === View.CONTACTS}
                    onClose={() => setActiveView(View.NONE)}
                    captureMode={captureMode}
                    setCaptureMode={setCaptureMode}
                    contacts={contacts}
                    onImportContacts={handleImportContacts}
                    newContactData={newContactData}
                    onSave={handleSaveContact}
                    onCancel={handleCancelContact}
                    newConfirmationData={newConfirmationData}
                    onSaveConfirmation={handleSaveConfirmation}
                    onCancelConfirmation={handleCancelConfirmation}
                    activeContactQuery={activeContactQuery}
                    onQueryHandled={() => setActiveContactQuery(null)}
                />
                <MediaView
                    show={activeView === View.MEDIA}
                    onClose={() => { setActiveView(View.NONE); setMediaCommand(null); }}
                    onCaptureMedia={handleCaptureMedia}
                    onRecordingStateChange={setIsRecordingMedia}
                    command={mediaCommand}
                    onCommandComplete={() => setMediaCommand(null)}
                    mediaItems={mediaItems}
                />
                <CalendarView
                    show={activeView === View.CALENDAR}
                    onClose={() => setActiveView(View.NONE)}
                    reminders={reminders}
                />
                <AnalysisView 
                    show={activeView === View.ANALYSIS}
                    onClose={() => setActiveView(View.NONE)}
                    transcriptions={transcriptions}
                />
                 <AiAssistantView
                    show={activeView === View.AI_ASSISTANT}
                    onClose={() => setActiveView(View.NONE)}
                    onAnalyzeText={handleAnalyzeText}
                    result={analysisResult}
                    onAddContact={handleAddExtractedContact}
                    onAddEvent={handleAddExtractedEvent}
                    onAddConfirmation={handleAddExtractedConfirmation}
                />
                <CommandsList 
                    show={activeView === View.COMMANDS}
                    onClose={() => setActiveView(View.NONE)}
                />
            </main>
        </div>
    );
}

export default App;
