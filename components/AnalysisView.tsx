
import React from 'react';
import { Transcription } from '../types';

interface AnalysisViewProps {
  show: boolean;
  onClose: () => void;
  transcriptions: Transcription[];
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ show, onClose, transcriptions }) => {
  return (
    <div className={`fixed inset-0 z-40 bg-slate-900 transition-transform duration-300 ease-in-out ${show ? 'translate-y-0' : 'translate-y-full'}`}>
        <header className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-bold">TRANSCRIPTION LOG</h2>
            <button onClick={onClose} title="Close" className="hover:text-red-500 text-2xl"><i className="fas fa-times"></i></button>
        </header>
        <div className="bg-slate-800/80 rounded-lg overflow-y-auto h-[calc(100%-70px)] m-4 mt-0 p-4 space-y-4">
            {transcriptions.map(item => (
                <div key={item.id} className={`flex items-start gap-4 ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {item.type !== 'user' && (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <i className={`fas ${item.type === 'system' ? 'fa-cog' : 'fa-brain'} text-teal-400`}></i>
                        </div>
                    )}
                    <div className={`p-3 rounded-lg max-w-lg ${item.type === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                        <p>{item.text}</p>
                        <p className="text-xs text-slate-400 mt-1 text-right">{item.timestamp.toLocaleTimeString()}</p>
                    </div>
                     {item.type === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-user text-slate-400"></i>
                        </div>
                    )}
                </div>
            ))}
            {transcriptions.length === 0 && <p className="text-slate-500 text-center mt-4">No transcriptions yet. Start speaking to see the log.</p>}
        </div>
    </div>
  );
};

export default AnalysisView;
