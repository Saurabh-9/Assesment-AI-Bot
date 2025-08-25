'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AudioRecorder({
  onAudioData,
  isRecording,
  setIsRecording,
  isListening,
  setIsListening,
  isAiResponding,
  isConnected
}) {
  const [stream, setStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    initializeAudio();
    return () => cleanup();
  }, []);

  const initializeAudio = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStream(audioStream);
      setIsInitialized(true);

      // Set up audio analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      toast.success('Microphone initialized');
    } catch (error) {
      console.error('Error initializing audio:', error);
      toast.error('Failed to access microphone');
    }
  };

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const startRecording = async () => {
    if (!stream || !isConnected) {
      toast.error('Microphone not available or not connected');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      const chunks = [];
      
      // Stream in near-real-time
      mediaRecorder.ondataavailable = async (event) => {
        try {
          if (event.data && event.data.size > 0) {
            const arrayBuffer = await event.data.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            await Promise.resolve(onAudioData(base64Audio));
            chunks.push(event.data);
          }
        } catch (e) {
          console.error('ondataavailable error:', e);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          await Promise.resolve(onAudioData(base64Audio));
        } catch (e) {
          console.error('onstop handler error:', e);
        }
      };

      mediaRecorder.start(250); // small chunks for lower latency
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      startAudioVisualization();
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopAudioVisualization();
      toast.success('Recording stopped');
    }
  };

  const startAudioVisualization = () => {
    const updateAudioLevel = () => {
      if (analyserRef.current && isRecording) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    };
    
    updateAudioLevel();
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      setAudioLevel(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording(); else startRecording();
  };

  const getAudioBars = () => {
    const bars = [];
    const barCount = 20;
    const normalizedLevel = audioLevel / 255;
    
    for (let i = 0; i < barCount; i++) {
      const height = Math.max(2, normalizedLevel * 40 * Math.random());
      bars.push(
        <div
          key={i}
          className="audio-bar"
          style={{ height: `${height}px` }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="subtitle">Voice Input</h3>
        <p className="caption">
          Click the microphone to start recording your voice
        </p>
      </div>

      {/* Audio Visualization */}
      <div className="flex justify-center">
        <div className="audio-wave">
          {getAudioBars()}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center">
        <motion.button
          onClick={toggleRecording}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={!isInitialized || !isConnected || isAiResponding}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAiResponding ? (
            <Loader className="w-8 h-8 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-red-300"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>

      {/* Status Indicators */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          {isInitialized ? (
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          ) : (
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          )}
          <span className="text-sm text-gray-600">
            {isInitialized ? 'Microphone Ready' : 'Initializing...'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          ) : (
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          )}
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {isRecording 
            ? 'Recording... Click to stop'
            : isAiResponding
            ? 'Processing your message...'
            : 'Click the microphone to start speaking'
          }
        </p>
      </div>
    </div>
  );
} 