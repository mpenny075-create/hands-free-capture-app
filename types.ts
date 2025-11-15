// FIX: Define all shared types for the application.

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: 'online' | 'offline';
  details?: string;
  phoneUrl?: string;
  emailUrl?: string;
}

export interface Confirmation {
  id: string;
  type: string;
  name: string;
  number: string;
  timestamp: Date;
}

export enum CaptureMode {
    GENERAL = 'general',
    CONTACT = 'contact',
    CONFIRMATION = 'confirmation',
}

export interface MediaItem {
  id: string;
  timestamp: Date;
  type: 'photo' | 'video' | 'audio';
  src: string;
}

export type MediaCommand =
  | { type: 'take-photos'; count: number; timer?: number }
  | { type: 'take-photo-timer'; duration: number }
  | { type: 'record-video'; duration?: number }
  | { type: 'record-audio' }
  | { type: 'stop-audio-recording' }
  | { type: 'stop-recording' }
  | { type: 'switch-camera' };

export interface Reminder {
  id: string;
  text: string;
  timestamp: Date;
}

export interface Transcription {
    id: string;
    text: string;
    timestamp: Date;
    type: 'user' | 'system' | 'model';
}

export enum View {
    NONE,
    CONTACTS,
    MEDIA,
    CALENDAR,
    ANALYSIS,
    COMMANDS,
    AI_ASSISTANT,
}

// Types for AI Analysis results
export interface ExtractedContact {
    name?: string;
    phone?: string;
    email?: string;
}

export interface ExtractedEvent {
    description?: string;
    date?: string;
    time?: string;
}

export interface ExtractedConfirmation {
    type?: string;
    name?: string;
    number?: string;
}

export interface AnalysisResult {
    contacts?: ExtractedContact[];
    events?: ExtractedEvent[];
    confirmations?: ExtractedConfirmation[];
}
