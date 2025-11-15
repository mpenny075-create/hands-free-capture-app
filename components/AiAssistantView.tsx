import React, { useState } from 'react';
import { AnalysisResult, ExtractedContact, ExtractedEvent, ExtractedConfirmation } from '../types';

interface AiAssistantViewProps {
  show: boolean;
  onClose: () => void;
  onAnalyzeText: (text: string) => Promise<string | null>;
  result: AnalysisResult | null;
  onAddContact: (contact: ExtractedContact) => void;
  onAddEvent: (event: ExtractedEvent) => void;
  onAddConfirmation: (confirmation: ExtractedConfirmation) => void;
}

const ResultCard: React.FC<{ title: string; icon: string; children: React.ReactNode; count: number }> = ({ title, icon, children, count }) => {
    if (count === 0) return null;
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-teal-400 mb-3"><i className={`fas ${icon} mr-3`}></i>{title} ({count})</h3>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    )
};

const AiAssistantView: React.FC<AiAssistantViewProps> = ({ show, onClose, onAnalyzeText, result, onAddContact, onAddEvent, onAddConfirmation }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    const err = await onAnalyzeText(text);
    if (err) setError(err);
    setIsLoading(false);
  };
  
  const hasResults = result && (result.contacts?.length || result.events?.length || result.confirmations?.length);

  return (
    <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${show ? 'pointer-events-auto bg-black/50' : 'pointer-events-none opacity-0'}`}>
      <div className={`fixed top-0 md:left-20 w-full md:w-[calc(100vw-80px)] h-full bg-slate-900 text-white p-6 pb-24 md:pb-6 transition-transform duration-300 ease-in-out ${show ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">AI ASSISTANT - TEXT ANALYSIS</h2>
            <button onClick={onClose} title="Close" className="hover:text-red-500 text-2xl"><i className="fas fa-times"></i></button>
        </header>

        <div className="flex flex-col md:flex-row h-[calc(100%-70px)] gap-6">
            {/* Input Area */}
            <div className="flex-1 md:flex-[2] flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Paste your text below:</h3>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g., 'Meeting with John Doe (555-1234) tomorrow at 2pm. My flight confirmation is AXYZ123...'"
                    className="flex-grow w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                />
                <button onClick={handleAnalyze} disabled={isLoading} className="mt-4 px-6 py-3 bg-teal-600 font-bold rounded-lg hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                    {isLoading ? (
                        <>
                            <i className="fas fa-circle-notch fa-spin mr-3"></i>
                            Analyzing...
                        </>
                    ) : (
                         <>
                            <i className="fas fa-wand-sparkles mr-3"></i>
                            Analyze Text
                        </>
                    )}
                </button>
            </div>

            {/* Results Area */}
            <div className="flex-1 bg-slate-800 rounded-lg p-4 flex flex-col">
                <h3 className="text-lg font-bold mb-4 border-b border-slate-700 pb-2">Extracted Information</h3>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    {error && <div className="p-3 bg-red-500/20 text-red-300 rounded-md">{error}</div>}
                    {!isLoading && !hasResults && !error && <p className="text-slate-500 text-center mt-4">Analysis results will appear here.</p>}
                    {isLoading && <p className="text-slate-400 text-center mt-4 animate-pulse">AI is thinking...</p>}
                    
                    {result && (
                        <>
                           <ResultCard title="Contacts" icon="fa-address-book" count={result.contacts?.length || 0}>
                                {result.contacts?.map((contact, i) => (
                                    <div key={`c-${i}`} className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{contact.name || 'N/A'}</p>
                                            <p className="text-sm text-slate-300">{contact.phone || contact.email || 'No contact info'}</p>
                                        </div>
                                        <button onClick={() => onAddContact(contact)} className="px-3 py-1 bg-blue-600 text-xs font-bold rounded hover:bg-blue-500 transition-colors" title="Add to contacts"><i className="fas fa-plus"></i> Add</button>
                                    </div>
                                ))}
                            </ResultCard>

                             <ResultCard title="Calendar Events" icon="fa-calendar-alt" count={result.events?.length || 0}>
                                {result.events?.map((event, i) => (
                                    <div key={`e-${i}`} className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{event.description || 'Event'}</p>
                                            <p className="text-sm text-slate-300">{event.date || ''} {event.time || ''}</p>
                                        </div>
                                        <button onClick={() => onAddEvent(event)} className="px-3 py-1 bg-blue-600 text-xs font-bold rounded hover:bg-blue-500 transition-colors" title="Add as reminder"><i className="fas fa-plus"></i> Add</button>
                                    </div>
                                ))}
                            </ResultCard>

                            <ResultCard title="Confirmations" icon="fa-receipt" count={result.confirmations?.length || 0}>
                                {result.confirmations?.map((conf, i) => (
                                    <div key={`conf-${i}`} className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{conf.number || 'N/A'}</p>
                                            <p className="text-sm text-slate-300">{conf.type || 'General'} - {conf.name || 'N/A'}</p>
                                        </div>
                                        <button onClick={() => onAddConfirmation(conf)} className="px-3 py-1 bg-blue-600 text-xs font-bold rounded hover:bg-blue-500 transition-colors" title="Add confirmation"><i className="fas fa-plus"></i> Add</button>
                                    </div>
                                ))}
                            </ResultCard>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantView;
