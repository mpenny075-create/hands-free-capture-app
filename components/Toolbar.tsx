import React from 'react';
import { View } from '../types';

interface ToolbarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isListening: boolean;
  isRecording: boolean;
  startListening: () => void;
  stopListening: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ activeView, setActiveView, isListening, isRecording, startListening, stopListening }) => {
  const views = [
    { id: View.CONTACTS, icon: 'fa-address-book', name: 'Contacts' },
    { id: View.MEDIA, icon: 'fa-camera-retro', name: 'Media' },
    { id: View.CALENDAR, icon: 'fa-calendar-alt', name: 'Calendar' },
    { id: View.AI_ASSISTANT, icon: 'fa-wand-sparkles', name: 'AI Assistant' },
    { id: View.ANALYSIS, icon: 'fa-chart-bar', name: 'Transcription' },
    { id: View.COMMANDS, icon: 'fa-list-ul', name: 'Commands' },
  ];

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const navButtonClasses = (viewId: View) => `
    flex-1 flex items-center justify-center h-full text-2xl transition-colors
    ${activeView === viewId ? 'text-teal-400' : 'text-slate-400 hover:text-white'}
  `;
  
  const desktopNavButtonClasses = (viewId: View) => `
    w-12 h-12 flex items-center justify-center rounded-lg text-2xl transition-colors
    ${activeView === viewId ? 'bg-teal-500 text-white' : 'hover:bg-slate-700'}
  `;

  return (
    <>
      {/* Desktop Toolbar (Left) */}
      <nav className="fixed top-0 left-0 h-full w-20 bg-slate-900 border-r border-slate-800 text-white flex-col items-center justify-between py-6 z-50 hidden md:flex">
        <div>
          <div className="text-3xl text-teal-400 mb-10">
            <i className="fas fa-brain"></i>
          </div>
          <ul className="space-y-6">
            {views.map(view => (
              <li key={view.id}>
                <button
                  onClick={() => setActiveView(view.id === activeView ? View.NONE : view.id)}
                  title={view.name}
                  className={desktopNavButtonClasses(view.id)}
                >
                  <i className={`fas ${view.icon}`}></i>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <button
            onClick={handleMicClick}
            disabled={isRecording}
            title={isListening ? 'Stop Listening' : 'Start Listening'}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${
              isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white'
            } ${isRecording ? 'bg-gray-500 cursor-not-allowed' : ''}`}
          >
            <i className="fas fa-microphone"></i>
          </button>
        </div>
      </nav>

      {/* Mobile Toolbar (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900 border-t border-slate-800 z-50 flex md:hidden items-center justify-around px-2">
         {views.slice(0, 4).map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id === activeView ? View.NONE : view.id)}
              title={view.name}
              className={navButtonClasses(view.id)}
            >
              <i className={`fas ${view.icon}`}></i>
            </button>
        ))}
         <button
          onClick={handleMicClick}
          disabled={isRecording}
          title={isListening ? 'Stop Listening' : 'Start Listening'}
          className={`relative -top-6 w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 shadow-lg
            ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white'}
            ${isRecording ? 'bg-gray-500 cursor-not-allowed' : ''}
          `}
        >
          <i className="fas fa-microphone"></i>
        </button>
         {views.slice(4).map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id === activeView ? View.NONE : view.id)}
              title={view.name}
              className={navButtonClasses(view.id)}
            >
              <i className={`fas ${view.icon}`}></i>
            </button>
        ))}
      </nav>
    </>
  );
};

export default Toolbar;
