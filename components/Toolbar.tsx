import React from 'react';
import { UIMode } from '../types';

interface ToolbarProps {
  isListening: boolean;
  onToggleListen: () => void;
  onSetUiMode: (mode: UIMode) => void;
  currentUiMode: UIMode;
  isRecording: boolean;
}

const ToolbarButton: React.FC<{ title: string; icon: string; onClick: () => void; isActive: boolean }> = ({ title, icon, onClick, isActive }) => (
    <button onClick={onClick} className={`w-16 md:w-11/12 aspect-square text-gray-300 md:border md:border-gray-600 rounded-md hover:bg-gray-700 hover:text-white transition-colors flex flex-col items-center justify-center ${isActive ? 'text-teal-400' : ''}`} title={title}>
        <i className={`fas ${icon} text-2xl`}></i>
        <span className="text-xs mt-1 md:hidden">{title}</span>
    </button>
);

const Toolbar: React.FC<ToolbarProps> = ({ isListening, onToggleListen, onSetUiMode, currentUiMode, isRecording }) => {
  return (
    <aside className="fixed bottom-0 left-0 md:top-0 w-full md:w-20 h-20 md:h-full bg-gray-800 text-white p-2 flex flex-row md:flex-col justify-around md:justify-start items-center z-50 shadow-lg order-last md:order-first">
      {/* Start/Stop Button */}
      <button 
        onClick={onToggleListen}
        className={`w-16 md:w-11/12 p-2.5 md:mt-2.5 text-sm rounded-md font-bold transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {isListening ? 'Stop' : 'Start'}
      </button>

      {/* Listening/Recording Indicator */}
      <div className="hidden md:block md:mt-5 text-center">
        {isListening && !isRecording && (
          <div className="text-red-500 animate-pulse">
            <i className="fas fa-microphone text-3xl"></i>
            <div className="text-xs font-bold">ON</div>
          </div>
        )}
        {isRecording && (
          <div className="text-red-500 animate-pulse">
              <i className="fas fa-circle text-3xl"></i>
              <div className="text-xs font-bold">REC</div>
          </div>
        )}
      </div>

      {/* Main Navigation Buttons */}
      <div className="flex flex-row md:flex-col justify-around md:justify-center items-center md:mt-auto md:mb-4 w-full">
          <ToolbarButton title="Contacts" icon="fa-address-book" onClick={() => onSetUiMode(UIMode.CONTACTS)} isActive={currentUiMode === UIMode.CONTACTS} />
          <ToolbarButton title="Media" icon="fa-camera" onClick={() => onSetUiMode(UIMode.MEDIA)} isActive={currentUiMode === UIMode.MEDIA} />
          <ToolbarButton title="Calendar" icon="fa-calendar-alt" onClick={() => onSetUiMode(UIMode.CALENDAR)} isActive={currentUiMode === UIMode.CALENDAR}/>
      </div>
    </aside>
  );
};

export default Toolbar;
