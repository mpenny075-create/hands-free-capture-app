import React from 'react';
import { Reminder } from '../types';

interface CalendarViewProps {
  show: boolean;
  onClose: () => void;
  reminders: Reminder[];
}

const CalendarDay: React.FC<{ day: number | string, isToday?: boolean, isDummy?: boolean }> = ({ day, isToday, isDummy }) => (
    <div className={`h-24 border-r border-b border-slate-700 p-2 flex flex-col ${isDummy ? 'bg-slate-800/50' : ''}`}>
        <span className={`font-bold ${isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center' : 'text-slate-400'}`}>
            {day}
        </span>
    </div>
)

const CalendarView: React.FC<CalendarViewProps> = ({ show, onClose, reminders }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({length: firstDayOfMonth}, (_, i) => <CalendarDay key={`dummy-${i}`} day="" isDummy />)
    .concat(Array.from({length: daysInMonth}, (_, i) => <CalendarDay key={i+1} day={i+1} isToday={i+1 === today.getDate()} />));

  return (
    <div className={`fixed inset-0 z-40 bg-slate-900 transition-transform duration-300 ease-in-out ${show ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col h-full">
            <header className="flex justify-between items-center p-4 flex-shrink-0">
                <h2 className="text-2xl font-bold">CALENDAR & REMINDERS</h2>
                <button onClick={onClose} title="Close" className="hover:text-red-500 text-2xl"><i className="fas fa-times"></i></button>
            </header>
            <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden p-4 pt-0 gap-4">
                {/* Calendar Grid */}
                <div className="flex-1 md:flex-[3] bg-slate-800/80 rounded-lg overflow-y-auto h-1/2 md:h-full">
                    <div className="grid grid-cols-7 text-center font-bold text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-800/80 z-10">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="p-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                        {days}
                    </div>
                </div>
                {/* Reminders List */}
                <div className="flex-1 bg-slate-800 rounded-lg p-4 flex flex-col h-1/2 md:h-full">
                    <h3 className="text-lg font-bold mb-4 border-b border-slate-700 pb-2">My Reminders</h3>
                    <div className="flex-grow overflow-y-auto">
                        {reminders.slice().reverse().map(reminder => (
                            <div key={reminder.id} className="bg-slate-700/50 p-3 rounded-md mb-3">
                                <p className="text-white">{reminder.text}</p>
                                <p className="text-xs text-slate-400 mt-1">{reminder.timestamp.toLocaleString()}</p>
                            </div>
                        ))}
                        {reminders.length === 0 && <p className="text-slate-500 text-center mt-4">Say 'add reminder...' to create a reminder.</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CalendarView;
