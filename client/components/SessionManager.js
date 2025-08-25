'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Mic, Globe, Volume2 } from 'lucide-react';

export default function SessionManager({ onCreateSession, onJoinSession, isConnected }) {
  const [activeTab, setActiveTab] = useState('create');
  const [sessionId, setSessionId] = useState('');
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState('male');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Not connected to server');
      return;
    }
    
    onCreateSession({
      language,
      voice,
      autoTranslate,
      voiceEnabled,
      subtitleEnabled,
    });
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      toast.error('Please enter a session ID');
      return;
    }
    
    if (!isConnected) {
      toast.error('Not connected to server');
      return;
    }
    
    onJoinSession(sessionId.trim(), {
      language,
      voice,
      autoTranslate,
      voiceEnabled,
      subtitleEnabled,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Conversation
          </h2>
          <p className="text-gray-600">
            Create a new session or join an existing one to begin your AI-powered conversation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
              activeTab === 'create'
                ? 'bg-white shadow-sm text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Session</span>
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
              activeTab === 'join'
                ? 'bg-white shadow-sm text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Join Session</span>
          </button>
        </div>

        {/* Session Settings */}
        <div className="mb-6">
          <h3 className="subtitle">Session Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Volume2 className="w-4 h-4 inline mr-2" />
                Voice
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Additional Options */}
          <div className="mt-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-translate responses</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable voice responses</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={subtitleEnabled}
                onChange={(e) => setSubtitleEnabled(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show subtitles</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        {activeTab === 'create' ? (
          <motion.button
            onClick={handleCreateSession}
            disabled={!isConnected}
            className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Mic className="w-5 h-5" />
            <span>Create New Session</span>
          </motion.button>
        ) : (
          <form onSubmit={handleJoinSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID"
                className="input"
                required
              />
            </div>
            
            <motion.button
              type="submit"
              disabled={!isConnected || !sessionId.trim()}
              className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-5 h-5" />
              <span>Join Session</span>
            </motion.button>
          </form>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Not connected to server. Please check your connection.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
} 