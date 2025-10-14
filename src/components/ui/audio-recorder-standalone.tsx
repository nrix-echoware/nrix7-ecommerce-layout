import React, { useRef, useState, useEffect } from 'react';
import { ShaderComponent } from './abstract-glassy-shader';
import { Mic, MicOff, Play, Pause, Square, Trash2, MessageSquare } from 'lucide-react';
import { Button } from './button';

interface AudioRecorderStandaloneProps {
  onAudioData?: (audioBlob: Blob) => void;
  className?: string;
}

export function AudioRecorderStandalone({ onAudioData, className = '' }: AudioRecorderStandaloneProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context for level monitoring
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        onAudioData?.(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Monitor audio levels
      monitorAudioLevel(stream);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const monitorAudioLevel = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    microphone.connect(analyser);
    analyser.fftSize = 256;

    const updateLevel = () => {
      if (isRecording) {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1
        animationRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Shader Background */}
      <div className="absolute inset-0">
        <ShaderComponent />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 p-12">
        <div className="text-center">
          <div className="mb-8">
            <MessageSquare className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-3xl font-light text-white mb-4">
              Voice Message
            </h3>
            <p className="text-white/80 text-lg">
              Share your thoughts with a voice message
            </p>
          </div>
          
          {/* Audio Level Visualizer */}
          {isRecording && (
            <div className="mb-8">
              <div className="w-full max-w-md mx-auto h-4 bg-white/20 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
              <p className="text-white/90 text-lg font-medium">
                Recording: {formatTime(recordingTime)}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center items-center gap-6 mb-8">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-20 h-20 p-0 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
              >
                <Mic size={32} />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-20 h-20 p-0 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
              >
                <Square size={32} />
              </Button>
            )}

            {audioBlob && (
              <>
                {!isPlaying ? (
                  <Button
                    onClick={playRecording}
                    variant="outline"
                    size="lg"
                    className="border-white/40 text-white hover:bg-white/20 rounded-full w-16 h-16 p-0 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Play size={24} />
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="lg"
                    className="border-white/40 text-white hover:bg-white/20 rounded-full w-16 h-16 p-0 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Pause size={24} />
                  </Button>
                )}

                <Button
                  onClick={deleteRecording}
                  variant="outline"
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/20 rounded-full w-16 h-16 p-0 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Trash2 size={24} />
                </Button>
              </>
            )}
          </div>

          {/* Status */}
          <div className="text-white/90 text-lg">
            {isRecording && (
              <p className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                Recording in progress...
              </p>
            )}
            {audioBlob && !isRecording && (
              <p>Recording saved! Click play to listen or record again.</p>
            )}
            {!audioBlob && !isRecording && (
              <p>Click the microphone to start recording</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
