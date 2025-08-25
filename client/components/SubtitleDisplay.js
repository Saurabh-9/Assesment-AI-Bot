'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bot, User, Loader } from 'lucide-react';

export default function SubtitleDisplay({
  currentSubtitle,
  aiResponse,
  isAiResponding,
  language,
  voice,
  subtitleEnabled
}) {
  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'hi': 'Hindi',
      'hinglish': 'Hinglish'
    };
    return languages[code] || code;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!subtitleEnabled) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Subtitles are disabled</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="subtitle">Live Conversation</h3>
        <p className="caption">
          Language: {getLanguageName(language)} | Voice: {voice}
        </p>
      </div>

      {/* User Input Display */}
      <AnimatePresence>
        {currentSubtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-blue-700">You</span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(Date.now())}
                  </span>
                </div>
                <p className="text-gray-900">{currentSubtitle}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Response Display */}
      <AnimatePresence>
        {isAiResponding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <Loader className="w-4 h-4 text-white animate-spin" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiResponse && !isAiResponding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-green-700">AI Assistant</span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(Date.now())}
                  </span>
                </div>
                <p className="text-gray-900 leading-relaxed">{aiResponse}</p>
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                  <span>Language: {getLanguageName(language)}</span>
                  <span>•</span>
                  <span>Voice: {voice}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!currentSubtitle && !aiResponse && !isAiResponding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Start Your Conversation
          </h4>
          <p className="text-gray-500 max-w-md mx-auto">
            Use the microphone above to start speaking. Your voice will be transcribed 
            and the AI will respond in real-time.
          </p>
        </motion.div>
      )}

      {/* Language and Voice Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Current Language:</span>
            <p className="text-gray-600">{getLanguageName(language)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Voice Type:</span>
            <p className="text-gray-600 capitalize">{voice}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 