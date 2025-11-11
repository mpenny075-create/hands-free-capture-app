
export enum UIMode {
  MAIN = 'MAIN',
  CONTACTS = 'CONTACTS',
  MEDIA = 'MEDIA',
}

export enum CaptureMode {
  GENERAL = 'GENERAL',
  CONTACT = 'CONTACT',
  CONFIRMATION = 'CONFIRMATION',
}

export interface Contact {
  name: string;
  status: 'online' | 'offline';
  phone?: string;
  email?: string;
  details?: string;
}

export type Confirmation = {
  type?: string;
  name?: string;
  number?: string;
};

// FIX: Add 'photo' to RecordingType to properly categorize captured images.
export type RecordingType = 'video' | 'audio' | 'photo';

export interface Recording {
  url: string;
  type: RecordingType;
  name: string;
}

export type MediaCommand = {
  action: string;
  durationInSeconds?: number;
  count?: number;
  delay?: number;
};
