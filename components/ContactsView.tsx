
import React, { useState } from 'react';
import { CaptureMode, Contact, Confirmation } from '../types';

interface ContactsViewProps {
  show: boolean;
  onClose: () => void;
  captureMode: CaptureMode;
  setCaptureMode: (mode: CaptureMode) => void;
  contacts: Contact[];
  newContactData: Partial<Contact>;
  onSave: () => void;
  onCancel: () => void;
  newConfirmationData: Partial<Confirmation>;
  onSaveConfirmation: () => void;
  onCancelConfirmation: () => void;
}

const DataCapturePanel: React.FC<Omit<ContactsViewProps, 'show' | 'onClose' | 'contacts' | 'setCaptureMode'>> = ({
    captureMode, newContactData, onSave, onCancel, newConfirmationData, onSaveConfirmation, onCancelConfirmation
}) => (
    <div className="p-6 bg-white rounded-lg shadow-xl border border-gray-200 w-full h-full flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Capture Details</h2>
        {captureMode === CaptureMode.CONTACT && (
             <div className="flex-grow">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Contact Data</h3>
                <div className="space-y-3 text-md">
                    <p><strong>Name:</strong> <span className="font-mono p-1 bg-gray-100 rounded">{newContactData.name || '...'}</span></p>
                    <p><strong>Phone:</strong> <span className="font-mono p-1 bg-gray-100 rounded">{newContactData.phone || '...'}</span></p>
                    <p><strong>Email:</strong> <span className="font-mono p-1 bg-gray-100 rounded">{newContactData.email || '...'}</span></p>
                    <p><strong>Details:</strong> <span className="font-mono p-1 bg-gray-100 rounded">{newContactData.details || '...'}</span></p>
                </div>
             </div>
        )}
        {captureMode === CaptureMode.CONFIRMATION && (
             <div className="flex-grow">
                <h3 className="text-lg font-semibold text-purple-600 mb-4">Confirmation Data</h3>
                 <div className="space-y-3 text-md">
                    <p><strong>Type:</strong> <span className="font-mono p-1 bg-gray-100 rounded">{newConfirmationData.type || '...'}</span></p>
                    <p><strong>Name/Type:</strong> <span className="font-mono p-1 bg-gray-100 rounded">{newConfirmationData.name || '...'}</span></p>
                    <p><strong>Confirmation #:</strong> <span className="font-mono p-1 bg-gray-100 rounded">{newConfirmationData.number || '...'}</span></p>
                </div>
             </div>
        )}

        <div className="mt-auto pt-4 border-t">
            {captureMode === CaptureMode.CONTACT && (
                <div className="flex gap-4">
                    <button onClick={onSave} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">Save Contact</button>
                    <button onClick={onCancel} className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">Cancel</button>
                </div>
            )}
            {captureMode === CaptureMode.CONFIRMATION && (
                <div className="flex gap-4">
                    <button onClick={onSaveConfirmation} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">Save Confirmation</button>
                    <button onClick={onCancelConfirmation} className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">Cancel</button>
                </div>
            )}
        </div>
    </div>
);


const ContactsView: React.FC<ContactsViewProps> = (props) => {
    const { show, onClose, captureMode, contacts, setCaptureMode } = props;
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const isCapturePanelOpen = captureMode === CaptureMode.CONTACT || captureMode === CaptureMode.CONFIRMATION;

    const handleMainClose = () => {
        setSelectedContact(null); // Close detail panel
        setCaptureMode(CaptureMode.GENERAL); // Close capture panel
        onClose(); // Close the whole view
    };

    return (
        // This container manages the presence of the panels on screen
        <div className={`fixed inset-0 z-40 ${show ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Left Panel: Capture Details */}
            <div className={`fixed top-0 left-20 w-[25vw] h-full p-4 transition-transform duration-300 ease-in-out
                ${isCapturePanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+80px)]'}
            `}>
                <DataCapturePanel {...props} />
            </div>

            {/* Right Panel: Contact List */}
            <div className={`fixed top-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out
                ${isCapturePanelOpen ? 'w-[calc(100vw-80px-25vw)] left-[calc(80px+25vw)]' : 'w-[calc(100vw-80px)] left-20'}
                ${show ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-4 flex flex-col h-full">
                    <header className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">CONTACTS</h2>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setCaptureMode(CaptureMode.CONTACT)} title="Add Contact" className="hover:text-teal-400"><i className="fas fa-user-plus"></i></button>
                            <button onClick={handleMainClose} title="Close" className="hover:text-red-500"><i className="fas fa-times"></i></button>
                        </div>
                    </header>
                    <div className="flex-grow overflow-y-auto">
                        {contacts.map((contact, index) => (
                            <div key={index} onClick={() => setSelectedContact(contact)} className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-700">
                                <i className={`fas fa-user-circle ${contact.status === 'online' ? 'text-teal-400' : 'text-slate-500'}`}></i>
                                <span>{contact.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Far Right Panel: Contact Details */}
            <div className={`fixed top-0 right-0 w-[30vw] h-full bg-white shadow-2xl p-6 transition-transform duration-300 ease-in-out border-l
                ${selectedContact ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {selectedContact && (
                    <div className="text-gray-800">
                         <header className="flex justify-between items-center mb-6 pb-4 border-b">
                            <h2 className="text-2xl font-bold">Contact Details</h2>
                            <button onClick={() => setSelectedContact(null)} title="Close" className="hover:text-red-500"><i className="fas fa-times"></i></button>
                        </header>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-500">Name</label>
                                <p className="text-lg">{selectedContact.name}</p>
                            </div>
                             <div>
                                <label className="text-sm font-bold text-gray-500">Status</label>
                                <p className={`text-lg capitalize ${selectedContact.status === 'online' ? 'text-green-600' : 'text-gray-600'}`}>{selectedContact.status}</p>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-500">Phone</label>
                                <p className="text-lg">{selectedContact.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-500">Email</label>
                                <p className="text-lg">{selectedContact.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-500">Details</label>
                                <p className="text-lg bg-gray-50 p-2 rounded">{selectedContact.details || 'No details provided.'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactsView;
