import React from 'react';

interface CommandsListProps {
  show: boolean;
  onClose: () => void;
}

const CommandCategory: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xl font-semibold text-teal-400 mb-3 mt-5 border-b border-slate-700 pb-2">{title}</h3>
        <ul className="space-y-2 text-slate-300 list-disc list-inside">
            {children}
        </ul>
    </div>
);

const CommandsList: React.FC<CommandsListProps> = ({ show, onClose }) => {
  return (
    <div className={`fixed inset-0 z-40 bg-slate-900 transition-transform duration-300 ease-in-out ${show ? 'translate-y-0' : 'translate-y-full'}`}>
        <header className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-bold">VOICE COMMANDS</h2>
            <button onClick={onClose} title="Close" className="hover:text-red-500 text-2xl"><i className="fas fa-times"></i></button>
        </header>
        <div className="overflow-y-auto h-[calc(100%-70px)] p-4 pt-0">
            <p className="text-slate-400 mb-6">You can activate listening by clicking the microphone icon.</p>
            
            <CommandCategory title="General">
                <li>"Show commands"</li>
                <li>"Hide commands" / "Close this"</li>
                <li>"Show transcription log"</li>
                <li>"Clear transcription"</li>
            </CommandCategory>
            
            <CommandCategory title="Contacts">
                <li>"Open contacts" / "Show my contacts"</li>
                <li>"Load my contacts" (Loads mock data)</li>
                <li>"Find contact Jane Doe" / "Show me contact 2"</li>
                <li>"Capture contact. Name is John Doe, phone is 555-1234, email is john@test.com"</li>
                <li>"Save contact" / "Cancel"</li>
                 <li>"Capture confirmation. It's a hotel confirmation for John Doe, number is H-123-XYZ"</li>
                 <li>"Save confirmation" / "Cancel"</li>
            </CommandCategory>

            <CommandCategory title="Media">
                <li>"Open media" / "Show media capture"</li>
                <li>"Take a photo" / "Take picture"</li>
                <li>"Take a photo in 5 seconds"</li>
                <li>"Take 3 photos"</li>
                <li>"Record a 10 second video"</li>
                <li>"Start recording video" / "Stop recording"</li>
                <li>"Start recording audio" / "Stop audio recording"</li>
                <li>"Switch camera"</li>
            </CommandCategory>

             <CommandCategory title="Calendar & Reminders">
                <li>"Open calendar" / "Show reminders"</li>
                <li>"Add reminder to buy milk"</li>
                <li>"Set a reminder: call Jane Doe"</li>
            </CommandCategory>

            <CommandCategory title="AI Assistant">
                <li>"Open AI assistant"</li>
            </CommandCategory>

        </div>
    </div>
  );
};

export default CommandsList;
