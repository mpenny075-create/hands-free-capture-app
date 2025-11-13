export enum UIMode {
  MAIN,
  CONTACTS,
  MEDIA,
  CALENDAR,
}

export enum CaptureMode {
  GENERAL,
  CONTACT,
  CONFIRMATION,
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  details?: string;
  status: 'online' | 'offline';
  phoneUrl?: string;
  emailUrl?: string;
}

export interface Confirmation {
  id:string;
  type: string;
  name: string;
  number: string;
}

export interface MediaItem {
    id: string;
    type: 'photo' | 'video' | 'audio';
    src: string;
    timestamp: Date;
}

export interface Reminder {
    id: string;
    text: string;
    timestamp: Date;
}

export type MediaCommand = 
 | { type: 'take-photos', count: number, timer?: number }
 | { type: 'take-photo-timer', duration: number }
 | { type: 'record-video', duration?: number }
 | { type: 'stop-recording' }
 | { type: 'record-audio' }
 | { type: 'stop-audio-recording' }
 | { type: 'switch-camera' };
