interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [key: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

import { useState, useEffect, useRef, useCallback } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);
  const transcriptRef = useRef('');

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldRestartRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (e: any) {
        console.error('Could not start recognition', e);
        setError(e.message || 'Could not start recognition');
        shouldRestartRef.current = false;
        setIsListening(false);
      }
    }
  }, [isListening]);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition not supported by this browser.');
      return;
    }

    if (!recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognitionRef.current = recognition;
    }
    const recog = recognitionRef.current;

    const handleResult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      const trimmedTranscript = finalTranscript.trim();
      if (trimmedTranscript && trimmedTranscript !== transcriptRef.current) {
        transcriptRef.current = trimmedTranscript;
        setTranscript(trimmedTranscript);
      }
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        console.warn('Speech recognition warning:', event.error);
        return; // Let the 'end' event handle the restart
      }
      console.error('Speech recognition error', event.error);
      setError(event.error);
      shouldRestartRef.current = false; // Stop on critical errors
      setIsListening(false);
    };

    const handleEnd = () => {
        if (shouldRestartRef.current) {
            // Use a small timeout to prevent rapid-fire errors from locking the mic.
            setTimeout(() => {
                if(shouldRestartRef.current) {
                    recog.start();
                }
            }, 300);
        } else {
            setIsListening(false);
        }
    };
    
    recog.addEventListener('result', handleResult as EventListener);
    recog.addEventListener('error', handleError as EventListener);
    recog.addEventListener('end', handleEnd);

    return () => {
      recog.removeEventListener('result', handleResult as EventListener);
      recog.removeEventListener('error', handleError as EventListener);
      recog.removeEventListener('end', handleEnd);
      shouldRestartRef.current = false;
      recog.stop();
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported: !!SpeechRecognition,
  };
};
