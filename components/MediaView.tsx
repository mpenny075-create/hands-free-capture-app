import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MediaItem, MediaCommand } from '../types';

interface MediaViewProps {
  show: boolean;
  onClose: () => void;
  onCaptureMedia: (item: Omit<MediaItem, 'id' | 'timestamp'>) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
  command: MediaCommand | null;
  onCommandComplete: () => void;
  mediaItems: MediaItem[];
}

const MediaView: React.FC<MediaViewProps> = ({ 
    show, onClose, onCaptureMedia, onRecordingStateChange, command, onCommandComplete, mediaItems 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const photoIntervalRef = useRef<number | null>(null);
  const videoTimeoutRef = useRef<number | null>(null);
  const recordingTimerIntervalRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [photosToTake, setPhotosToTake] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<number | null>(null);

  useEffect(() => {
    onRecordingStateChange(isRecording || isAudioRecording);
  }, [isRecording, isAudioRecording, onRecordingStateChange]);

  const cleanupTimers = () => {
    if (photoIntervalRef.current) clearInterval(photoIntervalRef.current);
    if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
    if (recordingTimerIntervalRef.current) clearInterval(recordingTimerIntervalRef.current);
    photoIntervalRef.current = null;
    videoTimeoutRef.current = null;
    recordingTimerIntervalRef.current = null;
    setCountdown(null);
    setRecordingTimer(null);
    setPhotosToTake(0);
  };

  const startStream = useCallback(async () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setIsStreamReady(false);

    let cameras = availableCameras;
    if (cameras.length === 0) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
    }

    if (cameras.length > 0) {
        const constraints = {
            video: { deviceId: { exact: cameras[currentCameraIndex].deviceId } },
            audio: true
        };
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    }
  }, [stream, availableCameras, currentCameraIndex]);
  
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanupTimers();
  }, []);

  useEffect(() => {
    if (show) {
      startStream();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (isRecording) {
        handleStopRecording();
      }
      cleanupTimers();
      setIsStreamReady(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    if (show && availableCameras.length > 0) {
        startStream();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCameraIndex]);

  const handleTakePhoto = useCallback(() => {
    if (videoRef.current && isStreamReady) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        onCaptureMedia({type: 'photo', src: canvas.toDataURL('image/jpeg')});
      }
    }
  }, [onCaptureMedia, isStreamReady]);

  useEffect(() => {
    if (photosToTake > 0 && isStreamReady) {
        const timerDuration = command?.type === 'take-photos' && command.timer ? command.timer : 3;
        setCountdown(timerDuration);
        photoIntervalRef.current = window.setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(photoIntervalRef.current!);
                    handleTakePhoto();
                    setPhotosToTake(p => p - 1);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    } else if (photosToTake === 0 && command?.type === 'take-photos' && command.count > 1) {
        onCommandComplete();
    }
    
    return () => {
        if(photoIntervalRef.current) clearInterval(photoIntervalRef.current);
    }
  }, [photosToTake, isStreamReady, handleTakePhoto, onCommandComplete, command]);


  const handleStartRecording = useCallback((duration?: number) => {
    if (stream && !isRecording && isStreamReady) {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorderRef.current = recorder;
        const recordedChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            onCaptureMedia({ type: 'video', src: url });
            setIsRecording(false);
            mediaRecorderRef.current = null;
            cleanupTimers();
        };
        
        recorder.start();
        setIsRecording(true);

        if (duration) {
            setRecordingTimer(Math.round(duration / 1000));
            recordingTimerIntervalRef.current = window.setInterval(() => {
                setRecordingTimer(t => (t !== null && t > 0) ? t - 1 : null);
            }, 1000);
            videoTimeoutRef.current = window.setTimeout(() => {
                handleStopRecording();
            }, duration);
        }
    }
  }, [stream, isRecording, onCaptureMedia, isStreamReady, handleStopRecording]);

    const handleStartAudioRecording = useCallback(async () => {
        if (isAudioRecording) return;
        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
            audioRecorderRef.current = recorder;
            const recordedChunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                onCaptureMedia({ type: 'audio', src: url });
                setIsAudioRecording(false);
                audioRecorderRef.current = null;
                audioStream.getTracks().forEach(track => track.stop());
            };
            
            recorder.start();
            setIsAudioRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    }, [isAudioRecording, onCaptureMedia]);

    const handleStopAudioRecording = useCallback(() => {
        if (audioRecorderRef.current && audioRecorderRef.current.state === 'recording') {
            audioRecorderRef.current.stop();
        }
    }, []);

  const handleSwitchCamera = useCallback(() => {
      if (availableCameras.length > 1) {
          setCurrentCameraIndex(prev => (prev + 1) % availableCameras.length);
      }
  }, [availableCameras.length]);
  
  const handleSinglePhotoTimer = useCallback((duration: number) => {
      setCountdown(duration);
      photoIntervalRef.current = window.setInterval(() => {
          setCountdown(prev => {
              if (prev === null || prev <= 1) {
                  clearInterval(photoIntervalRef.current!);
                  handleTakePhoto();
                  onCommandComplete();
                  return null;
              }
              return prev - 1;
          })
      }, 1000);
  }, [handleTakePhoto, onCommandComplete]);

  useEffect(() => {
    if (!command) return;
    if (command.type !== 'record-audio' && command.type !== 'stop-audio-recording' && !isStreamReady) return;

    switch(command.type) {
        case 'take-photos':
            if (command.count === 1) {
                handleTakePhoto();
                onCommandComplete();
            } else {
                setPhotosToTake(command.count);
            }
            break;
        case 'take-photo-timer':
            handleSinglePhotoTimer(command.duration);
            break;
        case 'record-video':
            handleStartRecording(command.duration);
            onCommandComplete();
            break;
        case 'record-audio':
            handleStartAudioRecording();
            onCommandComplete();
            break;
        case 'stop-audio-recording':
            handleStopAudioRecording();
            onCommandComplete();
            break;
        case 'stop-recording':
            handleStopRecording();
            onCommandComplete();
            break;
        case 'switch-camera':
            handleSwitchCamera();
            onCommandComplete();
            break;
    }
  }, [command, isStreamReady, handleTakePhoto, handleStartRecording, handleStopRecording, handleSwitchCamera, onCommandComplete, handleSinglePhotoTimer, handleStartAudioRecording, handleStopAudioRecording]);

  return (
    <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${show ? 'pointer-events-auto bg-black/50' : 'pointer-events-none opacity-0'}`}>
      <div className={`fixed top-0 left-20 w-[calc(100vw-80px)] h-full bg-slate-900 text-white p-6 transition-transform duration-300 ease-in-out ${show ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">MEDIA CAPTURE</h2>
            <button onClick={onClose} title="Close" className="hover:text-red-500 text-2xl"><i className="fas fa-times"></i></button>
        </header>
        <div className="flex h-[calc(100%-60px)] gap-6">
            <div className="flex-[2] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                <div className="absolute top-2 left-2 bg-black/50 p-2 rounded-md text-xs z-10">
                    <h4 className="font-bold mb-1">Available Cameras:</h4>
                    <ul>
                        {availableCameras.map((cam, index) => (
                            <li key={cam.deviceId} className={index === currentCameraIndex ? 'text-teal-400 font-bold' : ''}>
                                {cam.label || `Camera ${index + 1}`}
                            </li>
                        ))}
                         {availableCameras.length === 0 && <li>No cameras found.</li>}
                    </ul>
                </div>
                
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                    onCanPlay={() => setIsStreamReady(true)}
                ></video>

                {(countdown !== null || (recordingTimer !== null && isRecording)) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
                        <span className="text-9xl font-bold text-white" style={{ textShadow: '0 0 15px rgba(0,0,0,0.7)' }}>
                            {countdown !== null ? countdown : recordingTimer}
                        </span>
                    </div>
                )}
                
                {!isStreamReady && show && <div className="absolute text-white/50 animate-pulse">Initializing Camera...</div>}

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-800/70 flex justify-center items-center gap-6 backdrop-blur-sm">
                    <button onClick={handleSwitchCamera} disabled={isRecording || isAudioRecording || photosToTake > 0 || availableCameras.length <= 1} className="w-16 h-16 rounded-full bg-slate-600 disabled:bg-slate-700 disabled:opacity-50 flex items-center justify-center" title="Switch Camera">
                        <i className="fas fa-sync-alt text-white text-2xl"></i>
                    </button>
                    <button onClick={handleTakePhoto} disabled={isRecording || isAudioRecording || photosToTake > 0 || !isStreamReady} className="w-16 h-16 rounded-full bg-white disabled:bg-gray-400 flex items-center justify-center" title="Take Photo">
                        <i className="fas fa-camera text-slate-800 text-2xl"></i>
                    </button>
                     <button onClick={isAudioRecording ? handleStopAudioRecording : handleStartAudioRecording} disabled={isRecording || photosToTake > 0} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50" title={isAudioRecording ? 'Stop Audio Recording' : 'Record Audio'}>
                        <div className={`w-10 h-10 transition-all flex items-center justify-center ${isAudioRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-500'} rounded-full`}>
                            <i className="fas fa-microphone text-white text-2xl"></i>
                        </div>
                    </button>
                    <button onClick={isRecording ? handleStopRecording : () => handleStartRecording()} disabled={!isStreamReady || isAudioRecording || photosToTake > 0} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50" title={isRecording ? 'Stop Recording' : 'Record Video'}>
                        <div className={`w-10 h-10 transition-all ${isRecording ? 'bg-red-600 rounded-sm' : 'bg-red-500 rounded-full'}`}></div>
                    </button>
                </div>
            </div>
            <div className="flex-1 bg-slate-800 rounded-lg p-4 overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Captured Media</h3>
                <div className="grid grid-cols-2 gap-4">
                    {mediaItems.slice().reverse().map(item => (
                        <div key={item.id} className="relative aspect-square bg-black rounded-md overflow-hidden group">
                            {item.type === 'photo' && <img src={item.src} alt="captured content" className="w-full h-full object-cover" />}
                            {item.type === 'video' && <video src={item.src} className="w-full h-full object-cover" controls />}
                            {item.type === 'audio' && <div className="w-full h-full flex items-center justify-center p-2"><audio src={item.src} className="w-full" controls /></div>}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a href={item.src} download={`media-${item.id}.${item.type === 'photo' ? 'jpg' : 'webm'}`} className="text-white hover:text-teal-400" title="Download">
                                    <i className="fas fa-download text-2xl"></i>
                                </a>
                            </div>
                        </div>
                    ))}
                    {mediaItems.length === 0 && <p className="text-slate-400 col-span-2">No media captured yet.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MediaView;
