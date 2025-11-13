import React, { useState, useEffect } from 'react';
import { CaptureMode, Contact, Confirmation } from '../types';

interface ContactsViewProps {
  show: boolean;
  onClose: () => void;
  captureMode: CaptureMode;
  setCaptureMode: (mode: CaptureMode) => void;
  contacts: Contact[];
  onImportContacts: (contacts: Omit<Contact, 'id'|'status'>[]) => void;
  newContactData: Partial<Contact>;
  onSave: () => void;
  onCancel: () => void;
  newConfirmationData: Partial<Confirmation>;
  onSaveConfirmation: () => void;
  onCancelConfirmation: () => void;
  activeContactQuery: string | null;
  onQueryHandled: () => void;
}

const ContactsView: React.FC<ContactsViewProps> = (props) => {
    const { show, onClose, captureMode, contacts, setCaptureMode, activeContactQuery, onQueryHandled, newContactData, newConfirmationData, onImportContacts } = props;
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const isPanelOpen = selectedContact || captureMode === CaptureMode.CONTACT || captureMode === CaptureMode.CONFIRMATION;

    useEffect(() => {
        if (activeContactQuery) {
            const query = activeContactQuery.toLowerCase().trim();
            let contactToSelect: Contact | undefined;

            const matchNumber = query.match(/^(?:contact )?(\d+)$/);
            if (matchNumber) {
                const index = parseInt(matchNumber[1], 10) - 1;
                if (index >= 0 && index < contacts.length) {
                    contactToSelect = contacts[index];
                }
            } else {
                contactToSelect = contacts.find(c => c.name.toLowerCase().includes(query));
            }

            if (contactToSelect) {
                setCaptureMode(CaptureMode.GENERAL);
                setSelectedContact(contactToSelect);
            }
            onQueryHandled();
        }
    }, [activeContactQuery, contacts, onQueryHandled, setCaptureMode]);

    const handleImportContacts = async () => {
        if (!('contacts' in navigator && 'select' in (navigator as any).contacts)) {
            alert('Contact Picker API is not supported on your browser.');
            return;
        }

        const props = ['name', 'email', 'tel'];
        const opts = { multiple: true };

        try {
            // FIX: Explicitly type deviceContacts as any[] to avoid type errors with experimental APIs.
            const deviceContacts: any[] = await (navigator.contacts as any).select(props, opts);
            if (deviceContacts.length > 0) {
                const formattedContacts = deviceContacts.map((contact: any) => {
                    const phone = contact.tel?.[0];
                    const email = contact.email?.[0];
                    return {
                        name: contact.name?.[0] || '',
                        phone: phone,
                        email: email,
                        phoneUrl: phone ? `tel:${phone.replace(/\s/g, '')}` : undefined,
                        emailUrl: email ? `mailto:${email}` : undefined,
                    }
                });
                onImportContacts(formattedContacts);
            }
        } catch (ex) {
            // Handle user cancellation or other errors
            console.log('Import cancelled or failed.', ex);
        }
    };


    const handleMainClose = () => {
        setSelectedContact(null);
        setCaptureMode(CaptureMode.GENERAL);
        onClose();
    };

    const handlePanelClose = () => {
        if (captureMode === CaptureMode.CONTACT) props.onCancel();
        else if (captureMode === CaptureMode.CONFIRMATION) props.onCancelConfirmation();
        else setSelectedContact(null);
    };

    const getPanelTitle = () => {
        if (captureMode === CaptureMode.CONTACT) return "Capture Contact";
        if (captureMode === CaptureMode.CONFIRMATION) return "Capture Confirmation";
        if (selectedContact) return "Contact Details";
        return "";
    }

    return (
        <div className={`fixed inset-0 z-40 ${show ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div className={`fixed top-0 bottom-0 bg-slate-800 text-white transition-all duration-300 ease-in-out left-20
                ${isPanelOpen ? 'right-[30vw]' : 'right-0'}
                ${show ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-4 flex flex-col h-full">
                    <header className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">CONTACTS</h2>
                        <div className="flex items-center gap-4 text-xl">
                            <button onClick={handleImportContacts} title="Import from Device" className="hover:text-yellow-400"><i className="fas fa-mobile-alt"></i></button>
                            <button onClick={() => setCaptureMode(CaptureMode.CONTACT)} title="Add Contact" className="hover:text-teal-400"><i className="fas fa-user-plus"></i></button>
                            <button onClick={() => setCaptureMode(CaptureMode.CONFIRMATION)} title="Add Confirmation" className="hover:text-purple-400"><i className="fas fa-receipt"></i></button>
                            <button onClick={handleMainClose} title="Close" className="hover:text-red-500"><i className="fas fa-times"></i></button>
                        </div>
                    </header>
                    <div className="flex-grow overflow-y-auto">
                        {contacts.map((contact, index) => (
                            <div key={contact.id} onClick={() => setSelectedContact(contact)} className="flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-slate-700">
                                <span className="font-mono text-slate-500 w-6 text-center">{index + 1}.</span>
                                <i className={`fas fa-user-circle text-lg ${contact.status === 'online' ? 'text-teal-400' : 'text-slate-500'}`}></i>
                                <span>{contact.name}</span>
                            </div>
                        ))}
                        {contacts.length === 0 && <p className="text-slate-400 p-2">Say 'load my contacts' to see a sample list.</p>}
                    </div>
                </div>
            </div>

            <div className={`fixed top-0 bottom-0 right-0 w-[30vw] bg-white shadow-2xl p-6 transition-transform duration-300 ease-in-out
                ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {(isPanelOpen) && (
                    <div className="text-gray-800 flex flex-col h-full">
                         <header className="flex justify-between items-center mb-6 pb-4 border-b">
                            <h2 className="text-2xl font-bold">{getPanelTitle()}</h2>
                            <button onClick={handlePanelClose} title="Close" className="hover:text-red-500"><i className="fas fa-times"></i></button>
                        </header>
                        
                        {/* VIEW SELECTED CONTACT */}
                        {selectedContact && captureMode === CaptureMode.GENERAL && (
                             <>
                                <div className="space-y-4 flex-grow">
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
                                        <a href={selectedContact.phoneUrl} className="text-lg text-blue-600 hover:underline">{selectedContact.phone || 'N/A'}</a>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500">Email</label>
                                        <a href={selectedContact.emailUrl} className="text-lg text-blue-600 hover:underline">{selectedContact.email || 'N/A'}</a>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500">Details</label>
                                        <p className="text-lg bg-gray-50 p-2 rounded">{selectedContact.details || 'No details provided.'}</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t flex gap-4">
                                    <a href={selectedContact.phoneUrl} className={`px-5 py-2 rounded-md font-semibold text-white transition-colors ${selectedContact.phoneUrl ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                                        <i className="fas fa-phone mr-2"></i> Call
                                    </a>
                                    <a href={selectedContact.emailUrl} className={`px-5 py-2 rounded-md font-semibold text-white transition-colors ${selectedContact.emailUrl ? 'bg-sky-600 hover:bg-sky-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                                        <i className="fas fa-envelope mr-2"></i> Email
                                    </a>
                                </div>
                            </>
                        )}
                        
                        {/* CAPTURE CONTACT */}
                        {captureMode === CaptureMode.CONTACT && (
                            <>
                                <div className="flex-grow">
                                    <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-3 text-md items-center">
                                        <strong className="text-gray-600">Name:</strong>
                                        <span className="font-mono p-1 bg-gray-100 rounded min-h-[28px] block">{newContactData.name || '...'}</span>

                                        <strong className="text-gray-600">Phone:</strong>
                                        <span className="font-mono p-1 bg-gray-100 rounded min-h-[28px] block">{newContactData.phone || '...'}</span>
                                        
                                        <strong className="text-gray-600">Email:</strong>
                                        <span className="font-mono p-1 bg-gray-100 rounded min-h-[28px] block">{newContactData.email || '...'}</span>
                                        
                                        <strong className="text-gray-600 self-start pt-1">Details:</strong>
                                        <span className="font-mono p-1 bg-gray-100 rounded min-h-[28px] block">{newContactData.details || '...'}</span>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t flex gap-4">
                                    <button onClick={props.onSave} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">Save</button>
                                    <button onClick={props.onCancel} className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">Cancel</button>
                                </div>
                            </>
                        )}

                        {/* CAPTURE CONFIRMATION */}
                        {captureMode === CaptureMode.CONFIRMATION && (
                             <>
                                <div className="flex-grow">
                                    <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-3 text-md items-center">
                                        <strong className="text-gray-600">Type:</strong>
                                        <span className="font-mono p-1 bg-gray-100 rounded min-h-[28px] block">{newConfirmationData.type || '...'}</span>

                                        <strong className="text-gray-600">Name:</strong>
                                        <span className="font-mono p-1 bg-gray-100 rounded min-h-[28px] block">{newConfirmationData.name || '...'}</span>

                                        <strong className="text-gray-600">Confirmation #:</strong>
                                        <span className="font-mono p-1 bg-gray-100 rounded min-h-[28px] block">{newConfirmationData.number || '...'}</span>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t flex gap-4">
                                    <button onClick={props.onSaveConfirmation} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">Save</button>
                                    <button onClick={props.onCancelConfirmation} className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">Cancel</button>
                                </div>
                             </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactsView;
