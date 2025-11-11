
import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add type definitions for the Web Speech API which is not standard in TypeScript DOM types.
// This resolves 'Cannot find name SpeechRecognition' and related type errors.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const useSpeechRecognition = (
  onCommand: (command: string) => void,
  onInterimResult: (transcript: string) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);

  // Use a ref to store the latest callbacks. This prevents the main useEffect
  // from re-running every time the command handler is re-created in the parent component.
  const onCommandHandlerRef = useRef(onCommand);
  const onInterimResultHandlerRef = useRef(onInterimResult);

  useEffect(() => {
    onCommandHandlerRef.current = onCommand;
    onInterimResultHandlerRef.current = onInterimResult;
  }, [onCommand, onInterimResult]);


  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition not supported by this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldRestartRef.current) {
        // Use a small timeout to avoid browser issues with restarting too quickly.
        setTimeout(() => {
          if (recognitionRef.current && shouldRestartRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error("Error restarting speech recognition:", e);
              setError("Listener failed to restart.");
            }
          }
        }, 300);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore 'no-speech' and 'aborted' errors which are not critical.
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Call the latest handlers via the ref to avoid stale closures
      onInterimResultHandlerRef.current(interimTranscript);
      if (finalTranscript) {
        onCommandHandlerRef.current(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
    };
    // This main setup useEffect now has no dependencies, so it only runs once.
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldRestartRef.current = true;
        recognitionRef.current.start();
      } catch (e) {
        setError("Could not start listening. Please ensure microphone permissions are granted.")
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { isListening, startListening, stopListening, error };
};

export default useSpeechRecognition;
