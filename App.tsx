
import React, { useState, useCallback, useEffect } from 'react';
import { UIMode, CaptureMode, Contact, Confirmation, MediaCommand, RecordingType } from './types';
import Toolbar from './components/Toolbar';
import ContactsView from './components/ContactsView';
import MediaView from './components/MediaView';
import CommandsList from './components/CommandsList'; // Import the new component
import useSpeechRecognition from './hooks/useSpeechRecognition';

const wordsToNumbers = (text: string): string => {
    const numberMap: { [key: string]: string } = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    };
    return text.split(' ').map(word => numberMap[word.toLowerCase()] || word).join(' ');
};

const App: React.FC = () => {
  const [uiMode, setUiMode] = useState<UIMode>(UIMode.MAIN);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(CaptureMode.GENERAL);
  const [status, setStatus] = useState('Ready to start.');
  const [log, setLog] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');

  // State for new entries
  const [newContact, setNewContact] = useState<Partial<Contact>>({});
  const [newConfirmation, setNewConfirmation] = useState<Partial<Confirmation>>({});
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  
  // State to dispatch commands to the media view
  const [mediaCommand, setMediaCommand] = useState<MediaCommand | null>(null);
  
  // Enhanced recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<RecordingType | null>(null);

  // State for the new commands list panel
  const [showCommandsList, setShowCommandsList] = useState(false);


  const [contacts, setContacts] = useState<Contact[]>([
    { name: 'ROHACAN.HIRONS', status: 'online', phone: '555-123-4567', email: 'rho@example.com', details: 'Project Lead for the Titan initiative.' },
    { name: 'JANE DOE', status: 'offline', phone: '555-987-6543', email: 'jane.d@example.com', details: 'Met at the Mars conference.' }
  ]);
  
  const handleCommand = useCallback((rawCommand: string) => {
    const command = rawCommand.trim();
    const lowerCaseCommand = command.toLowerCase();
    setLog(prev => [...prev, command]);

    // --- Commands List Commands (Highest Priority) ---
    if (lowerCaseCommand === "commands list") {
        setShowCommandsList(true);
        return;
    }
    if (lowerCaseCommand === "close list" || lowerCaseCommand === "hide commands") {
        setShowCommandsList(false);
        return;
    }

    // --- Media Commands ---
    const isRecordVideo = lowerCaseCommand.includes("record video");
    const isRecordSound = lowerCaseCommand.includes("record sound");
    const isTakePicture = lowerCaseCommand.includes("take a picture") || lowerCaseCommand.includes("take a photo");

    if (isRecordVideo || isRecordSound) {
      if (uiMode !== UIMode.MEDIA) {
        setUiMode(UIMode.MEDIA);
      }

      const commandWithDigits = wordsToNumbers(lowerCaseCommand);
      let durationInSeconds: number | undefined = undefined;

      const durationMatch = commandWithDigits.match(/(?:for\s)?(\d+)/);

      if (durationMatch) {
        let duration = parseInt(durationMatch[1], 10);
        if (commandWithDigits.includes("minute")) {
          duration *= 60; // Convert to seconds if "minute" is mentioned
        }
        durationInSeconds = duration;
      }
      
      const action = isRecordVideo ? 'record video' : 'record sound';
      const friendlyType = isRecordVideo ? 'Video' : 'Audio';
      
      if (durationInSeconds) {
          setStatus(`Recording ${friendlyType} for ${durationInSeconds} seconds.`);
      } else {
          setStatus(`Started ${friendlyType} recording.`);
      }

      setMediaCommand({ action, durationInSeconds });
      return;
    }

    if (isTakePicture) {
      if (uiMode !== UIMode.MEDIA) {
        setUiMode(UIMode.MEDIA);
      }
      
      const triggerPhrase = lowerCaseCommand.includes("take a picture") ? "take a picture" : "take a photo";
      const paramsString = wordsToNumbers(lowerCaseCommand.substring(lowerCaseCommand.indexOf(triggerPhrase) + triggerPhrase.length)).trim();
      const parts = paramsString.split(/\s+/).filter(p => p); // filter out empty strings

      let count = 1;
      let delay = 0;

      // Check for count first (e.g., "5 timer 3")
      if (parts.length > 0 && !isNaN(parseInt(parts[0], 10))) {
        count = parseInt(parts[0], 10);
      }

      // Check for timer (e.g., "timer 3" or "5 timer 3")
      const timerIndex = parts.indexOf("timer");
      if (timerIndex !== -1 && parts.length > timerIndex + 1 && !isNaN(parseInt(parts[timerIndex + 1], 10))) {
        delay = parseInt(parts[timerIndex + 1], 10);
      }
      
      setStatus(`Taking ${count} photo(s) with a ${delay}s delay.`);
      setMediaCommand({ action: 'take picture', count, delay });
      return;
    }

    if (lowerCaseCommand.includes("stop recording")) {
      if (uiMode !== UIMode.MEDIA) {
        setUiMode(UIMode.MEDIA);
      }
      setMediaCommand({ action: lowerCaseCommand });
      return;
    }
    
    // --- Contact Capture Mode Commands ---
    if (captureMode === CaptureMode.CONTACT) {
      const parts = command.split(' ');
      const field = parts[0].toLowerCase();
      const value = parts.slice(1).join(' ');

      if (['name', 'phone', 'email', 'details'].includes(field)) {
        setNewContact(prev => ({ ...prev, [field]: value }));
        setStatus(`Set ${field} to "${value}"`);
        return;
      }

      if (lowerCaseCommand === "save contact") {
        if (newContact.name) {
          const finalContact: Contact = {
            name: newContact.name,
            status: 'offline',
            phone: newContact.phone,
            email: newContact.email,
            details: newContact.details,
          };
          setContacts(prev => [...prev, finalContact]);
          setStatus(`Contact "${finalContact.name}" saved.`);
          setNewContact({});
          setCaptureMode(CaptureMode.GENERAL);
        } else {
          setStatus("Cannot save contact without a name.");
        }
        return;
      }

      if (lowerCaseCommand === "cancel contact") {
        setNewContact({});
        setCaptureMode(CaptureMode.GENERAL);
        setStatus("Contact capture cancelled.");
        return;
      }
    }
    
    // --- Confirmation Capture Mode Commands ---
    if (captureMode === CaptureMode.CONFIRMATION) {
        const keywords: (keyof Confirmation)[] = ['type', 'name', 'number'];
        let commandHandled = false;

        for (const keyword of keywords) {
            const keywordIndex = lowerCaseCommand.indexOf(keyword);
            if (keywordIndex > -1) {
                // Extract the value after the keyword
                let value = command.substring(keywordIndex + keyword.length).trim();
                
                // If the field is 'number', convert spoken words to digits and remove spaces.
                if (keyword === 'number') {
                    value = wordsToNumbers(value).replace(/\s/g, '');
                }

                setNewConfirmation(prev => ({ ...prev, [keyword]: value }));
                setStatus(`Set confirmation ${keyword} to "${value}"`);
                commandHandled = true;
                break; // Stop after handling the first found keyword
            }
        }

        if (commandHandled) return;

        if (lowerCaseCommand === "save confirmation") {
            if (newConfirmation.number) {
                setConfirmations(prev => [...prev, newConfirmation as Confirmation]);
                console.log("Confirmations Saved:", [...confirmations, newConfirmation]);
                setStatus(`Confirmation "${newConfirmation.number}" saved.`);
                setNewConfirmation({});
                setCaptureMode(CaptureMode.GENERAL);
            } else {
                setStatus("Cannot save confirmation without a number.");
            }
            return;
        }

        if (lowerCaseCommand === "cancel confirmation") {
            setNewConfirmation({});
            setCaptureMode(CaptureMode.GENERAL);
            setStatus("Confirmation capture cancelled.");
            return;
        }
    }


    // --- Global Navigation Commands ---
    if (lowerCaseCommand.startsWith("show contacts")) {
      setUiMode(UIMode.CONTACTS);
      setCaptureMode(CaptureMode.GENERAL);
    } else if (lowerCaseCommand.startsWith("open camera") || lowerCaseCommand.startsWith("open media")) {
      setUiMode(UIMode.MEDIA);
    } else if (lowerCaseCommand.startsWith("return to main") || lowerCaseCommand.startsWith("close camera") || lowerCaseCommand.startsWith("close contacts")) {
      setUiMode(UIMode.MAIN);
    } else if (lowerCaseCommand.startsWith("capture contact")) {
      setUiMode(UIMode.CONTACTS);
      setCaptureMode(CaptureMode.CONTACT);
      setNewContact({}); // Clear any previous data
      setStatus('Ready to capture contact. Say "name", "phone", etc.');
    } else if (lowerCaseCommand.startsWith("capture confirmation")) {
        setUiMode(UIMode.CONTACTS);
        setCaptureMode(CaptureMode.CONFIRMATION);
        setNewConfirmation({}); // Clear previous data
        setStatus('Ready to capture confirmation. Say "type", "name", or "number".');
    }
  }, [uiMode, captureMode, newContact, newConfirmation, confirmations]);
  
  const { isListening, startListening, stopListening, error } = useSpeechRecognition(handleCommand, setInterimTranscript);

  useEffect(() => {
    if(error) setStatus(error);
  }, [error]);

  const handleSetUiMode = (mode: UIMode) => {
      setUiMode(mode);
      if(mode === UIMode.CONTACTS) {
        setCaptureMode(CaptureMode.GENERAL);
      }
  }

  const handleSaveContact = () => handleCommand("save contact");
  const handleCancelContact = () => handleCommand("cancel contact");
  const handleSaveConfirmation = () => handleCommand("save confirmation");
  const handleCancelConfirmation = () => handleCommand("cancel confirmation");

  // FIX: Memoize callbacks to prevent unnecessary re-renders of MediaView.
  const handleCloseMediaView = useCallback(() => {
    handleCommand("close camera");
  }, [handleCommand]);

  const handleRecordingStateChange = useCallback((recording: boolean, type: RecordingType | null) => {
      setIsRecording(recording);
      setRecordingType(type);
  }, []);

  const onCommandComplete = useCallback(() => {
      setMediaCommand(null);
  }, []);

  const getCurrentModeText = () => {
    if (isRecording && recordingType) {
        return `RECORDING ${recordingType.toUpperCase()}`;
    }
    if (uiMode === UIMode.CONTACTS) {
        if (captureMode === CaptureMode.CONTACT) return 'CONTACT CAPTURE';
        if (captureMode === CaptureMode.CONFIRMATION) return 'CONFIRMATION CAPTURE';
        return 'CONTACTS VIEW';
    }
    if (uiMode === UIMode.MEDIA) {
        return 'MEDIA VIEW'
    }
    return 'GENERAL LISTENING';
  };


  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Toolbar 
        isListening={isListening} 
        onToggleListen={isListening ? stopListening : startListening}
        onSetUiMode={handleSetUiMode}
        currentUiMode={uiMode}
        isRecording={isRecording}
      />
      <main className="flex-1 ml-20 p-6 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-gray-800">Hands-Free Capture App</h1>
            <p id="status" className="text-gray-600 mt-2 h-6">{isListening ? 'Listening...' : status}</p>
            <p id="currentMode" className="text-xl font-bold text-orange-500 my-2">
                Mode: <span className="capitalize font-mono">**{getCurrentModeText()}**</span>
            </p>
            <textarea 
                id="logArea" 
                readOnly 
                className="w-full h-32 p-3 border rounded-md bg-white shadow-inner font-mono text-sm text-gray-700"
                value={log.join('\n')}
                placeholder="Finalized transcripts will appear here..."
            ></textarea>
            <div className="mt-4 p-4 border border-yellow-400 bg-yellow-50 rounded-lg text-left">
                <span className="font-bold text-gray-700">Live Transcript:</span> <span className="text-gray-800">{interimTranscript}</span>
            </div>
        </div>
      </main>

      <CommandsList show={showCommandsList} onClose={() => setShowCommandsList(false)} />

      <ContactsView 
        show={uiMode === UIMode.CONTACTS} 
        onClose={() => handleCommand("close contacts")}
        captureMode={captureMode}
        setCaptureMode={setCaptureMode}
        contacts={contacts}
        newContactData={newContact}
        onSave={handleSaveContact}
        onCancel={handleCancelContact}
        newConfirmationData={newConfirmation}
        onSaveConfirmation={handleSaveConfirmation}
        onCancelConfirmation={handleCancelConfirmation}
      />
      <MediaView 
        show={uiMode === UIMode.MEDIA}
        onClose={handleCloseMediaView}
        command={mediaCommand}
        onCommandComplete={onCommandComplete}
        onRecordingStateChange={handleRecordingStateChange}
      />
    </div>
  );
};

export default App;
