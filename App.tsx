import React, { useState, useEffect, useCallback, useRef } from 'react';
import Toolbar from './components/Toolbar';
import ContactsView from './components/ContactsView';
import MediaView from './components/MediaView';
import CalendarView from './components/CalendarView';
import CommandsList from './components/CommandsList';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { UIMode, CaptureMode, Contact, Confirmation, MediaItem, MediaCommand, Reminder } from './types';
import { MOCK_CONTACTS } from './mockData';

const wordToNumber = (word: string): number => {
    const words: { [key: string]: number } = {
        one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };
    const lowerWord = word.toLowerCase();
    return words[lowerWord] || parseInt(word, 10);
};

const processCommand = async (command: string, captureMode: CaptureMode): Promise<any> => {
    console.log("Processing command:", command);

    const patterns = {
        SET_NAME: /^name (.+)/i,
        SET_PHONE: /^phone (.+)/i,
        SET_EMAIL: /^email (.+)/i,
        SET_DETAILS: /^details (.+)/i,
        CONFIRM_TYPE: /^type (.+)/i,
        CONFIRM_NUMBER: /^number (.+)/i,
        TAKE_PHOTOS_TIMER: /^(?:take a picture|take a photo|take) (one|two|three|four|five|six|seven|eight|nine|ten|\d+) (?:pictures|photos) (?:with a )?timer (\d+)/i,
        TAKE_PHOTOS: /^(?:take a picture|take a photo|take) (one|two|three|four|five|six|seven|eight|nine|ten|\d+) (?:pictures|photos)/i,
        TAKE_PHOTO_TIMER: /^(?:take a picture|take a photo) (?:with a )?timer (\d+)/i,
        RECORD_VIDEO_FOR: /^record video for (\d+) (seconds|minutes)/i,
        ADD_REMINDER: /^(?:add reminder|remind me to) (.+)/i,
        CALL_CONTACT: /^(?:call|dial) (.+)/i,
        EMAIL_CONTACT: /^email (.+)/i,
    };

    if (patterns.SET_PHONE.test(command)) return { action: 'set_contact_phone', payload: command.match(patterns.SET_PHONE)?.[1] };
    if (patterns.SET_EMAIL.test(command)) return { action: 'set_contact_email', payload: command.match(patterns.SET_EMAIL)?.[1] };
    if (patterns.SET_DETAILS.test(command)) return { action: 'set_contact_details', payload: command.match(patterns.SET_DETAILS)?.[1] };
    if (patterns.CONFIRM_TYPE.test(command)) return { action: 'set_confirmation_type', payload: command.match(patterns.CONFIRM_TYPE)?.[1] };
    if (patterns.CONFIRM_NUMBER.test(command)) return { action: 'set_confirmation_number', payload: command.match(patterns.CONFIRM_NUMBER)?.[1] };
    if (patterns.ADD_REMINDER.test(command)) return { action: 'add_reminder', payload: command.match(patterns.ADD_REMINDER)?.[1] };
    if (patterns.CALL_CONTACT.test(command)) return { action: 'call_contact', payload: command.match(patterns.CALL_CONTACT)?.[1] };
    
    const emailMatch = command.match(patterns.EMAIL_CONTACT);
    if (emailMatch && captureMode !== CaptureMode.CONTACT) {
        return { action: 'email_contact', payload: emailMatch[1] };
    }

    const takePhotosTimerMatch = command.match(patterns.TAKE_PHOTOS_TIMER);
    if (takePhotosTimerMatch) {
        const count = wordToNumber(takePhotosTimerMatch[1]);
        const timer = parseInt(takePhotosTimerMatch[2], 10);
        return { action: 'take_photos', payload: { count, timer } };
    }

    const takePhotosMatch = command.match(patterns.TAKE_PHOTOS);
    if (takePhotosMatch) {
        const count = wordToNumber(takePhotosMatch[1]);
        return { action: 'take_photos', payload: { count } };
    }

    const takePhotoTimerMatch = command.match(patterns.TAKE_PHOTO_TIMER);
    if (takePhotoTimerMatch) {
        return { action: 'take_photo_timer', payload: { duration: parseInt(takePhotoTimerMatch[1], 10) } };
    }
    
    const recordVideoMatch = command.match(patterns.RECORD_VIDEO_FOR);
    if (recordVideoMatch) {
        const value = parseInt(recordVideoMatch[1], 10);
        const unit = recordVideoMatch[2];
        const duration = unit === 'seconds' ? value * 1000 : value * 60 * 1000;
        return { action: 'record_video', payload: { duration } };
    }


    if (patterns.SET_NAME.test(command)) {
        const payload = command.match(patterns.SET_NAME)?.[1];
        if (captureMode === CaptureMode.CONTACT) return { action: 'set_contact_name', payload };
        if (captureMode === CaptureMode.CONFIRMATION) return { action: 'set_confirmation_name', payload };
    }
    
    const lowerCaseCommand = command.toLowerCase().trim();
    switch (lowerCaseCommand) {
        case 'commands list': case 'show commands': return { action: 'show_commands' };
        case 'close list': case 'hide commands': return { action: 'hide_commands' };
        case 'show contacts': return { action: 'show_contacts' };
        case 'load my contacts': return { action: 'load_contacts' };
        case 'open camera': case 'open media': return { action: 'show_media' };
        case 'show calendar': return { action: 'show_calendar' };
        case 'return to main': case 'close panels': return { action: 'show_main' };
        case 'capture contact': return { action: 'capture_contact' };
        case 'save contact': return { action: 'save_contact' };
        case 'cancel contact': return { action: 'cancel_contact' };
        case 'capture confirmation': return { action: 'capture_confirmation' };
        case 'save confirmation': return { action: 'save_confirmation' };
        case 'cancel confirmation': return { action: 'cancel_confirmation' };
        case 'take a picture': case 'take a photo': return { action: 'take_photos', payload: { count: 1 } };
        case 'record sound': return { action: 'record_audio' };
        case 'stop recording sound': return { action: 'stop_audio_recording' };
        case 'stop recording': case 'stop recording video': return { action: 'stop_recording' };
        case 'switch camera': return { action: 'switch_camera' };
    }

    if (lowerCaseCommand.startsWith('record video')) return { action: 'record_video', payload: {} };

    return { action: 'unknown', payload: command };
};

const App: React.FC = () => {
    const [uiMode, setUiMode] = useState<UIMode>(UIMode.MAIN);
    const [captureMode, setCaptureMode] = useState<CaptureMode>(CaptureMode.GENERAL);
    const [showCommands, setShowCommands] = useState(false);
    
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [newContact, setNewContact] = useState<Partial<Contact>>({});
    const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
    const [newConfirmation, setNewConfirmation] = useState<Partial<Confirmation>>({});
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [activeContactQuery, setActiveContactQuery] = useState<string | null>(null);

    
    const [mediaCommand, setMediaCommand] = useState<MediaCommand | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    
    const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

    const handleSaveContact = useCallback(() => {
        if (newContact.name) {
            const phoneUrl = newContact.phone ? `tel:${newContact.phone.replace(/\s/g, '')}` : undefined;
            const emailUrl = newContact.email ? `mailto:${newContact.email}` : undefined;
            setContacts(prev => [...prev, { id: Date.now().toString(), status: 'offline', ...newContact, phoneUrl, emailUrl } as Contact]);
            setNewContact({});
            setCaptureMode(CaptureMode.GENERAL);
        }
    }, [newContact]);

    const handleCancelContact = useCallback(() => {
        setNewContact({});
        setCaptureMode(CaptureMode.GENERAL);
    }, []);

    const handleSaveConfirmation = useCallback(() => {
        if (newConfirmation.type && newConfirmation.name && newConfirmation.number) {
            setConfirmations(prev => [...prev, { id: Date.now().toString(), ...newConfirmation } as Confirmation]);
            setNewConfirmation({});
            setCaptureMode(CaptureMode.GENERAL);
        }
    }, [newConfirmation]);

    const handleCancelConfirmation = useCallback(() => {
        setNewConfirmation({});
        setCaptureMode(CaptureMode.GENERAL);
    }, []);
    
    const handleImportContacts = useCallback((importedContacts: Omit<Contact, 'id' | 'status'>[]) => {
        const newContacts = importedContacts.map(c => ({
            ...c,
            id: `imported-${c.name}-${c.phone || c.email}`,
            status: 'offline' as const
        }));
        // Basic de-duplication
        setContacts(prev => {
            const existing = new Set(prev.map(c => `${c.name}|${c.phone}`));
            const uniqueNew = newContacts.filter(c => !existing.has(`${c.name}|${c.phone}`));
            return [...prev, ...uniqueNew];
        });
    }, []);

    const handleCaptureMedia = (item: Omit<MediaItem, 'id' | 'timestamp'>) => {
        setMediaItems(prev => [...prev, { id: Date.now().toString(), timestamp: new Date(), ...item }]);
    };

    useEffect(() => {
        if (transcript) {
            (async () => {
                const result = await processCommand(transcript, captureMode);
                console.log("Parsed command:", result);

                switch(result.action) {
                    case 'show_commands': setShowCommands(true); break;
                    case 'hide_commands': setShowCommands(false); break;
                    case 'show_contacts': setUiMode(UIMode.CONTACTS); break;
                    case 'load_contacts': setContacts(MOCK_CONTACTS); break;
                    case 'show_media': setUiMode(UIMode.MEDIA); break;
                    case 'show_calendar': setUiMode(UIMode.CALENDAR); break;
                    case 'show_main':
                        setUiMode(UIMode.MAIN);
                        setCaptureMode(CaptureMode.GENERAL);
                        break;
                    case 'capture_contact':
                         setUiMode(UIMode.CONTACTS);
                         setCaptureMode(CaptureMode.CONTACT);
                         break;
                    case 'save_contact': handleSaveContact(); break;
                    case 'cancel_contact': handleCancelContact(); break;
                    case 'capture_confirmation':
                         setUiMode(UIMode.CONTACTS);
                         setCaptureMode(CaptureMode.CONFIRMATION);
                         break;
                    case 'save_confirmation': handleSaveConfirmation(); break;
                    case 'cancel_confirmation': handleCancelConfirmation(); break;
                    case 'add_reminder':
                        setReminders(prev => [...prev, { id: Date.now().toString(), text: result.payload, timestamp: new Date() }]);
                        // Optionally show a confirmation toast
                        break;
                    case 'call_contact': case 'email_contact':
                        setUiMode(UIMode.CONTACTS);
                        setActiveContactQuery(result.payload);
                        break;
                    case 'set_contact_name':
                        if (captureMode === CaptureMode.CONTACT) setNewContact(c => ({...c, name: result.payload}));
                        break;
                    case 'set_confirmation_name':
                         if (captureMode === CaptureMode.CONFIRMATION) setNewConfirmation(c => ({...c, name: result.payload}));
                        break;
                    case 'set_contact_phone':
                        if (captureMode === CaptureMode.CONTACT) setNewContact(c => ({...c, phone: result.payload}));
                        break;
                    case 'set_contact_email':
                        if (captureMode === CaptureMode.CONTACT) setNewContact(c => ({...c, email: result.payload}));
                        break;
                    case 'set_contact_details':
                        if (captureMode === CaptureMode.CONTACT) setNewContact(c => ({...c, details: result.payload}));
                        break;
                    case 'set_confirmation_type':
                        if (captureMode === CaptureMode.CONFIRMATION) setNewConfirmation(c => ({...c, type: result.payload}));
                        break;
                    case 'set_confirmation_number':
                        if (captureMode === CaptureMode.CONFIRMATION) setNewConfirmation(c => ({...c, number: result.payload}));
                        break;
                    case 'take_photos':
                         if (uiMode !== UIMode.MEDIA) setUiMode(UIMode.MEDIA);
                         setMediaCommand({ type: 'take-photos', count: result.payload.count, timer: result.payload.timer });
                        break;
                    case 'take_photo_timer':
                        if (uiMode !== UIMode.MEDIA) setUiMode(UIMode.MEDIA);
                        setMediaCommand({ type: 'take-photo-timer', duration: result.payload.duration });
                        break;
                    case 'record_video':
                        if (uiMode !== UIMode.MEDIA) setUiMode(UIMode.MEDIA);
                        setMediaCommand({ type: 'record-video', duration: result.payload.duration });
                        break;
                    case 'record_audio':
                        if (uiMode !== UIMode.MEDIA) setUiMode(UIMode.MEDIA);
                        setMediaCommand({ type: 'record-audio' });
                        break;
                    case 'stop_audio_recording':
                        if (uiMode === UIMode.MEDIA) setMediaCommand({ type: 'stop-audio-recording' });
                        break;
                    case 'stop_recording':
                        if (uiMode === UIMode.MEDIA) setMediaCommand({ type: 'stop-recording' });
                        break;
                    case 'switch_camera':
                        if (uiMode === UIMode.MEDIA) setMediaCommand({ type: 'switch-camera' });
                        break;
                }
            })();
        }
    }, [transcript, captureMode, handleSaveContact, handleCancelContact, handleSaveConfirmation, handleCancelConfirmation, uiMode]);

    const handleToggleListen = () => {
        isListening ? stopListening() : startListening();
    };

    return (
        <div className="bg-slate-900 min-h-screen text-white font-sans">
            <Toolbar
                isListening={isListening}
                onToggleListen={handleToggleListen}
                onSetUiMode={setUiMode}
                currentUiMode={uiMode}
                isRecording={isRecording}
            />
            <main className="ml-20 p-8">
                <h1 className="text-4xl font-bold mb-2">AI Voice Assistant</h1>
                <p className="text-slate-400">Say <code className="bg-slate-700 text-teal-300 px-1.5 py-0.5 rounded">'commands list'</code> to see available voice commands.</p>
                
                <div className="mt-8 p-4 bg-slate-800/50 rounded-lg min-h-[6rem] flex items-center justify-center flex-col shadow-inner">
                    {isListening ? (
                        <>
                            <div className="text-2xl text-red-500 animate-pulse">Listening...</div>
                            {transcript && (
                                <p className="text-slate-400 mt-2 text-center">
                                    Last command: <span className="text-white font-mono bg-slate-700 px-2 py-1 rounded">{transcript}</span>
                                </p>
                            )}
                        </>
                    ) : (
                         <div className="text-center text-xl text-slate-500">
                            {uiMode === UIMode.MAIN ? "Press 'Start' to begin." : "Voice recognition is off. Press 'Start' to enable."}
                        </div>
                    )}
                </div>
            </main>
            <ContactsView
                show={uiMode === UIMode.CONTACTS}
                onClose={() => setUiMode(UIMode.MAIN)}
                captureMode={captureMode}
                setCaptureMode={setCaptureMode}
                contacts={contacts}
                onImportContacts={handleImportContacts}
                newContactData={newContact}
                onSave={handleSaveContact}
                onCancel={handleCancelContact}
                newConfirmationData={newConfirmation}
                onSaveConfirmation={handleSaveConfirmation}
                onCancelConfirmation={handleCancelConfirmation}
                activeContactQuery={activeContactQuery}
                onQueryHandled={() => setActiveContactQuery(null)}
            />
            <MediaView
                show={uiMode === UIMode.MEDIA}
                onClose={() => {
                    setUiMode(UIMode.MAIN);
                    setMediaCommand(null);
                }}
                onCaptureMedia={handleCaptureMedia}
                onRecordingStateChange={setIsRecording}
                command={mediaCommand}
                onCommandComplete={() => setMediaCommand(null)}
                mediaItems={mediaItems}
            />
            <CalendarView
                show={uiMode === UIMode.CALENDAR}
                onClose={() => setUiMode(UIMode.MAIN)}
                reminders={reminders}
            />
            <CommandsList
                show={showCommands}
                onClose={() => setShowCommands(false)}
            />
        </div>
    );
};
export default App;
