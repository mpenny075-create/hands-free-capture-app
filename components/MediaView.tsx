
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaCommand, Recording, RecordingType } from '../types';

interface MediaViewProps {
  show: boolean;
  onClose: () => void;
  command: MediaCommand | null;
  onCommandComplete: () => void;
  onRecordingStateChange: (isRecording: boolean, type: RecordingType | null) => void;
}

const MediaView: React.FC<MediaViewProps> = ({ show, onClose, command, onCommandComplete, onRecordingStateChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  
  const [photos, setPhotos] = useState<Recording[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  // State for camera and recording management
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Buffer for commands that arrive before the camera is ready
  const pendingCommandRef = useRef<MediaCommand | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    
    setIsCameraReady(false);
    setIsRecording(false);
    setElapsedTime(0);
    setCountdown(null);
    pendingCommandRef.current = null; // Clear any pending command
    onRecordingStateChange(false, null);
  }, [onRecordingStateChange]);

  // Effect to initialize and tear down the camera stream
  useEffect(() => {
    if (show) {
      const getMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing media devices.", err);
          alert("Could not access camera or microphone. Please check permissions.");
          onClose();
        }
      };
      getMedia();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [show, cleanup, onClose]);


  const handleTakePicture = useCallback(async (count: number = 1, delay: number = 0) => {
    if (!videoRef.current || !isCameraReady) return;

    if (delay > 0) {
      for (let i = delay; i > 0; i--) {
        setCountdown(i);
        await new Promise(res => setTimeout(res, 1000));
      }
      setCountdown(null);
    }
    
    for (let i = 0; i < count; i++) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            // Flash effect
            const flash = document.createElement('div');
            flash.className = 'absolute inset-0 bg-white opacity-80';
            video.parentElement?.appendChild(flash);
            setTimeout(() => flash.remove(), 150);
            
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            const newPhoto: Recording = { url: dataUrl, type: 'photo', name: `photo-${Date.now()}.jpg` };
            setPhotos(prev => [newPhoto, ...prev]);
        }
        if (i < count - 1) await new Promise(res => setTimeout(res, 500));
    }
  }, [isCameraReady]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    setIsRecording(false);
    setElapsedTime(0);
    onRecordingStateChange(false, null);
  }, [onRecordingStateChange]);

  const handleStartRecording = useCallback((type: 'video' | 'audio', duration?: number) => {
    if (!streamRef.current || !isCameraReady || isRecording) return;
    
    chunksRef.current = [];
    const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType });

    mediaRecorderRef.current.ondataavailable = (event) => chunksRef.current.push(event.data);

    mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const name = `${type}-${new Date().toISOString()}_${Math.round(elapsedTime)}s.webm`;
        setRecordings(prev => [{ url, type, name }, ...prev]);
        chunksRef.current = [];
    };

    mediaRecorderRef.current.start(1000); // Collect data every second
    setIsRecording(true);
    setElapsedTime(0);
    onRecordingStateChange(true, type);

    elapsedTimerRef.current = window.setInterval(() => setElapsedTime(t => t + 1), 1000);

    if (duration) {
        timerRef.current = window.setTimeout(handleStopRecording, duration * 1000);
    }
  }, [isCameraReady, isRecording, onRecordingStateChange, handleStopRecording, elapsedTime]);
  
  // --- Definitive Command Handling Fix ---
  // 1. Buffer the command when it arrives.
  useEffect(() => {
    if (command) {
        pendingCommandRef.current = command;
    }
  }, [command]);

  // 2. Execute the buffered command ONLY when the camera is ready.
  useEffect(() => {
    const executeCommand = async () => {
        if (isCameraReady && pendingCommandRef.current) {
            const cmd = pendingCommandRef.current;
            pendingCommandRef.current = null; // Clear command after execution
            
            switch (cmd.action) {
                case 'take picture':
                    await handleTakePicture(cmd.count, cmd.delay);
                    break;
                case 'record video':
                    handleStartRecording('video', cmd.durationInSeconds);
                    break;
                case 'record sound':
                    handleStartRecording('audio', cmd.durationInSeconds);
                    break;
                case 'stop recording':
                    handleStopRecording();
                    break;
            }
            onCommandComplete();
        }
    };
    executeCommand();
  }, [isCameraReady, command, onCommandComplete, handleStartRecording, handleStopRecording, handleTakePicture]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  return (
    <div className={`fixed inset-0 z-40 ${show ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Left Panel: Media List */}
        <div className={`fixed top-0 left-20 w-[25vw] h-full bg-slate-800 text-white p-4 transition-transform duration-300 ease-in-out
            ${show ? 'translate-x-0' : '-translate-x-[calc(100%+80px)]'}
        `}>
            <h3 className="text-xl font-bold mb-4">Captured Photos</h3>
            <div className="h-1/2 overflow-y-auto pr-2 space-y-2">
                {photos.length === 0 ? <p className="text-slate-400">No photos yet.</p> :
                 photos.map((p, i) => (
                    <div key={i} className="relative group aspect-video bg-black rounded overflow-hidden">
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover"/>
                        <a href={p.url} download={p.name} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-2xl transition-opacity">
                            <i className="fas fa-save"></i>
                        </a>
                    </div>
                ))}
            </div>
            <hr className="my-4 border-slate-600"/>
            <h3 className="text-xl font-bold mb-4">Recordings</h3>
            <div className="h-1/2 overflow-y-auto pr-2 space-y-2">
                 {recordings.length === 0 ? <p className="text-slate-400">No recordings yet.</p> :
                  recordings.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-700 p-2 rounded">
                        <i className={`fas ${r.type === 'video' ? 'fa-video' : 'fa-microphone'} text-teal-400`}></i>
                        <span className="text-sm truncate flex-grow">{r.name}</span>
                        <a href={r.url} download={r.name} className="text-white hover:text-teal-400"><i className="fas fa-download"></i></a>
                    </div>
                  ))}
            </div>
        </div>

        {/* Right Panel: Camera View */}
        <div className={`fixed top-0 left-[calc(80px+25vw)] w-[calc(100vw-80px-25vw)] h-full bg-black p-4 transition-transform duration-300 ease-in-out
            ${show ? 'translate-x-0' : 'translate-x-[calc(100%+80px)]'}
        `}>
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-contain"
                    onLoadedMetadata={() => setIsCameraReady(true)}
                ></video>

                {countdown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="text-9xl font-bold text-white drop-shadow-lg">{countdown}</span>
                    </div>
                )}
                
                {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                        <i className="fas fa-circle"></i>
                        <span>{formatTime(elapsedTime)}</span>
                    </div>
                )}

                {/* On-screen controls */}
                <div className="absolute bottom-6 flex items-center gap-8">
                    <button 
                        onClick={() => handleTakePicture()}
                        disabled={isRecording}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center disabled:opacity-50"
                    >
                       <i className="fas fa-camera text-3xl text-gray-800"></i>
                    </button>
                    <button 
                        onClick={isRecording ? handleStopRecording : () => handleStartRecording('video')}
                        className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center"
                    >
                       {isRecording ? <div className="w-6 h-6 bg-white rounded"></div> : <i className="fas fa-video text-2xl text-white"></i>}
                    </button>
                </div>
                 <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl p-2 bg-black/50 rounded-full hover:bg-red-600 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
  );
};

export default MediaView;
