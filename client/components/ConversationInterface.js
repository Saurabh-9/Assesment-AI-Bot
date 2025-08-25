'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  LogOut, 
  Square,
  Download,
  Globe,
  Circle,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import AudioRecorder from './AudioRecorder';
import SubtitleDisplay from './SubtitleDisplay';
import ConversationHistory from './ConversationHistory';
import SettingsPanel from './SettingsPanel';

export default function ConversationInterface({ 
  socket, 
  session, 
  onLeaveSession, 
  isConnected 
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionRecording, setSessionRecording] = useState(false);
  const [language, setLanguage] = useState(session?.language || 'en');
  const [voice, setVoice] = useState(session?.voice || 'male');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);

  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('session-joined', (data) => {
      setConversationHistory(data.history || []);
      toast.success('Joined session successfully');
    });

    socket.on('ai-response', (data) => {
      setAiResponse(data.text);
      setIsAiResponding(false);
      
      // Add to conversation history
      const newEntry = {
        id: Date.now(),
        timestamp: data.timestamp,
        userInput: currentSubtitle,
        aiResponse: data.text,
        language: data.language,
        voice: data.voice,
      };
      
      setConversationHistory(prev => [...prev, newEntry]);
      setCurrentSubtitle('');
      
      // Play audio if available
      if (data.audio && voiceEnabled) {
        playAudioResponse(data.audio);
      }
    });

    socket.on('language-changed', (data) => {
      setLanguage(data.language);
      toast.success(`Language changed to ${getLanguageName(data.language)}`);
    });

    socket.on('voice-changed', (data) => {
      setVoice(data.voice);
      toast.success(`Voice changed to ${data.voice}`);
    });

    socket.on('recording-started', () => {
      setSessionRecording(true);
      toast.success('Session recording started');
    });

    socket.on('recording-stopped', (data) => {
      setSessionRecording(false);
      toast.success('Session recording stopped');
    });

    socket.on('error', (error) => {
      toast.error(error.message);
    });

    return () => {
      socket.off('session-joined');
      socket.off('ai-response');
      socket.off('language-changed');
      socket.off('voice-changed');
      socket.off('recording-started');
      socket.off('recording-stopped');
      socket.off('error');
    };
  }, [socket, currentSubtitle, voiceEnabled]);

  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'hi': 'Hindi',
      'hinglish': 'Hinglish'
    };
    return languages[code] || code;
  };

  const handleAudioData = async (audioData) => {
    if (!socket || !isConnected) return;

    try {
      setIsAiResponding(true);
      socket.emit('interrupt');
      socket.emit('audio-stream', {
        audioData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending audio data:', error);
      toast.error('Failed to send audio');
      setIsAiResponding(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    if (socket) {
      socket.emit('change-language', { language: newLanguage });
    }
  };

  const handleVoiceChange = (newVoice) => {
    if (socket) {
      socket.emit('change-voice', { voice: newVoice });
    }
  };

  const handleStartRecording = () => {
    if (socket) {
      socket.emit('start-recording');
    }
  };

  const handleStopRecording = () => {
    if (socket) {
      socket.emit('stop-recording');
    }
  };

  const playAudioResponse = async (audioData) => {
    try {
      if (audioData.method === 'POST') {
        const resp = await fetch(audioData.audioUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(audioData.payload || {}),
        });
        if (!resp.ok) throw new Error('TTS fetch failed');
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        URL.revokeObjectURL(url);
      } else {
        const audio = new Audio(audioData.audioUrl);
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleLeaveSession = () => {
    if (sessionRecording) {
      handleStopRecording();
    }
    onLeaveSession();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Session: {session?.id?.slice(0, 8)}...
                </h2>
                <p className="text-sm text-gray-600">
                  Language: {getLanguageName(language)} | Voice: {voice}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn btn-secondary"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="btn btn-secondary"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleLeaveSession}
                  className="btn btn-danger"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Audio Recorder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <AudioRecorder
              onAudioData={handleAudioData}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              isListening={isListening}
              setIsListening={setIsListening}
              isAiResponding={isAiResponding}
              isConnected={isConnected}
            />
          </motion.div>

          {/* Subtitle Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <SubtitleDisplay
              currentSubtitle={currentSubtitle}
              aiResponse={aiResponse}
              isAiResponding={isAiResponding}
              language={language}
              voice={voice}
              subtitleEnabled={subtitleEnabled}
            />
          </motion.div>

          {/* Recording Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="subtitle">Session Recording</h3>
                {sessionRecording && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full recording-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">Recording</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {!sessionRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Circle className="w-4 h-4" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="btn btn-danger flex items-center space-x-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="card"
              >
                <SettingsPanel
                  language={language}
                  voice={voice}
                  voiceEnabled={voiceEnabled}
                  subtitleEnabled={subtitleEnabled}
                  onLanguageChange={handleLanguageChange}
                  onVoiceChange={handleVoiceChange}
                  onVoiceEnabledChange={setVoiceEnabled}
                  onSubtitleEnabledChange={setSubtitleEnabled}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation History */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="card"
              >
                <ConversationHistory
                  history={conversationHistory}
                  language={language}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 