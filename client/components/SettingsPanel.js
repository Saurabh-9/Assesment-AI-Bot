'use client';

import { motion } from 'framer-motion';
import { Settings, Globe, Volume2, Eye, EyeOff } from 'lucide-react';

export default function SettingsPanel({
  language,
  voice,
  voiceEnabled,
  subtitleEnabled,
  onLanguageChange,
  onVoiceChange,
  onVoiceEnabledChange,
  onSubtitleEnabledChange
}) {
  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'hi': 'Hindi',
      'hinglish': 'Hinglish'
    };
    return languages[code] || code;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="subtitle">Settings</h3>
      </div>

      {/* Language Settings */}
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Language</span>
        </label>
        
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'Hindi' },
            { value: 'hinglish', label: 'Hinglish' }
          ].map((lang) => (
            <motion.button
              key={lang.value}
              onClick={() => onLanguageChange(lang.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                language === lang.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{lang.label}</span>
                {language === lang.value && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Voice Settings */}
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Voice</span>
        </label>
        
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ].map((voiceOption) => (
            <motion.button
              key={voiceOption.value}
              onClick={() => onVoiceChange(voiceOption.value)}
              className={`p-3 rounded-lg border text-center transition-all ${
                voice === voiceOption.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium capitalize">{voiceOption.label}</span>
                {voice === voiceOption.value && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Voice Responses</span>
          </div>
          <motion.button
            onClick={() => onVoiceEnabledChange(!voiceEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              voiceEnabled ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                voiceEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </motion.button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {subtitleEnabled ? (
              <Eye className="w-4 h-4 text-gray-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-600" />
            )}
            <span className="text-sm font-medium text-gray-700">Subtitles</span>
          </div>
          <motion.button
            onClick={() => onSubtitleEnabledChange(!subtitleEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              subtitleEnabled ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                subtitleEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </motion.button>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Settings</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Language:</span>
            <span className="font-medium">{getLanguageName(language)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Voice:</span>
            <span className="font-medium capitalize">{voice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Voice Responses:</span>
            <span className={`font-medium ${voiceEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {voiceEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtitles:</span>
            <span className={`font-medium ${subtitleEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {subtitleEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 