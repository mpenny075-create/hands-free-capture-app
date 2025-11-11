
import React from 'react';

interface CommandsListProps {
  show: boolean;
  onClose: () => void;
}

const CommandItem: React.FC<{ command: string; description: string }> = ({ command, description }) => (
    <div className="mb-3">
        <code className="bg-slate-700 text-teal-300 font-mono px-2 py-1 rounded-md text-sm">{command}</code>
        <p className="text-slate-400 text-sm mt-1 ml-1">{description}</p>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h3 className="text-xl font-bold text-white border-b-2 border-slate-600 pb-2 mb-4">{title}</h3>
        {children}
    </section>
);

const CommandsList: React.FC<CommandsListProps> = ({ show, onClose }) => {
  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${show ? 'bg-black/60 pointer-events-auto' : 'bg-black/0 pointer-events-none'}`}>
      <div
        className={`fixed top-0 left-0 w-full max-w-md h-full bg-slate-800 text-white shadow-2xl p-6 transition-transform duration-300 ease-in-out overflow-y-auto
            ${show ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold">Voice Commands</h2>
          <button onClick={onClose} title="Close" className="text-2xl hover:text-red-500 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </header>

        <Section title="Global Commands">
            <CommandItem command="commands list" description="Shows this list of commands." />
            <CommandItem command="close list / hide commands" description="Hides this list of commands." />
            <CommandItem command="show contacts" description="Opens the contact management view." />
            <CommandItem command="open camera / open media" description="Opens the camera and media recording view." />
            <CommandItem command="return to main" description="Closes any open view and returns to the main screen." />
        </Section>
        
        <Section title="Contacts View">
            <CommandItem command="capture contact" description="Opens the panel to add a new contact." />
            <CommandItem command="capture confirmation" description="Opens the panel to add a new confirmation." />
            <div className="pl-4 border-l-2 border-slate-700 mt-4">
                <h4 className="text-lg font-semibold text-slate-300 mb-3">While in Contact Capture mode:</h4>
                <CommandItem command="name [full name]" description="Sets the contact's name. Ex: 'name Jane Doe'" />
                <CommandItem command="phone [phone number]" description="Sets the phone number. Ex: 'phone 555 123 4567'" />
                <CommandItem command="email [email address]" description="Sets the email. Ex: 'email jane@example.com'" />
                <CommandItem command="details [notes]" description="Adds notes about the contact." />
                <CommandItem command="save contact" description="Saves the new contact information." />
                <CommandItem command="cancel contact" description="Cancels adding the new contact." />
            </div>
             <div className="pl-4 border-l-2 border-slate-700 mt-4">
                <h4 className="text-lg font-semibold text-slate-300 mb-3">While in Confirmation Capture mode:</h4>
                <CommandItem command="type [booking, order, etc.]" description="Sets the confirmation type." />
                <CommandItem command="name [airline, hotel, etc.]" description="Sets the associated name for the confirmation." />
                <CommandItem command="number [confirmation #]" description="Sets the confirmation number. Ex: 'number 123xyz'" />
                <CommandItem command="save confirmation" description="Saves the new confirmation." />
                <CommandItem command="cancel confirmation" description="Cancels adding the new confirmation." />
            </div>
        </Section>

        <Section title="Media View">
            <CommandItem command="take a picture / take a photo" description="Captures a single photo from the camera." />
            <CommandItem command="record video [for X seconds/minutes]" description="Records video. Specify an optional duration." />
            <CommandItem command="record sound [for X seconds/minutes]" description="Records audio. Specify an optional duration." />
            <CommandItem command="stop recording" description="Stops any active video or audio recording." />
        </Section>

      </div>
    </div>
  );
};

export default CommandsList;
