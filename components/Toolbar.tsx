
import React from 'react';
import { UIMode } from '../types';

interface ToolbarProps {
  isListening: boolean;
  onToggleListen: () => void;
  onSetUiMode: (mode: UIMode) => void;
  currentUiMode: UIMode;
  isRecording: boolean;
}

const ToolbarButton: React.FC<{ title: string; icon: string; onClick: () => void; }> = ({ title, icon, onClick }) => (
    <button onClick={onClick} className="w-11/12 aspect-square mt-4 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 hover:text-white transition-colors flex flex-col items-center justify-center" title={title}>
        <i className={`fas ${icon} text-2xl`}></i>
    </button>
);


const Toolbar: React.FC<ToolbarProps> = ({ isListening, onToggleListen, onSetUiMode, currentUiMode, isRecording }) => {
  return (
    <aside className="fixed top-0 left-0 h-full w-20 bg-gray-800 text-white p-2 flex flex-col items-center z-50 shadow-lg">
      <button 
        onClick={onToggleListen}
        className={`w-11/12 p-2.5 mt-2.5 text-sm rounded-md font-bold transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {isListening ? 'Stop' : 'Start'}
      </button>

      {isListening && !isRecording && (
        <div className="mt-5 text-red-500 text-center animate-pulse">
          <i className="fas fa-microphone text-3xl"></i>
          <div className="text-xs font-bold">ON</div>
        </div>
      )}

      {isRecording && (
        <div className="mt-5 text-red-500 text-center animate-pulse">
            <i className="fas fa-circle text-3xl"></i>
            <div className="text-xs font-bold">REC</div>
        </div>
      )}

      <div className="mt-auto mb-4 w-full flex flex-col items-center">
        {currentUiMode === UIMode.MAIN ? (
            <>
                <ToolbarButton title="Contacts" icon="fa-address-book" onClick={() => onSetUiMode(UIMode.CONTACTS)} />
                <ToolbarButton title="Media" icon="fa-camera" onClick={() => onSetUiMode(UIMode.MEDIA)} />
            </>
        ) : (
            <button onClick={() => onSetUiMode(UIMode.MAIN)} className="w-11/12 p-2 mt-5 text-xs bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors flex flex-col items-center" title="Close Panels">
                <i className="fas fa-times text-2xl mb-1"></i>
                <span>Close</span>
            </button>
        )}
      </div>
    </aside>
  );
};

export default Toolbar;
