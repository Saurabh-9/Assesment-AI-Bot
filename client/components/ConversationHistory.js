'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, Bot, Clock, Search, Download } from 'lucide-react';

export default function ConversationHistory({ history, language }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState(history);

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

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredHistory(history);
      return;
    }

    const filtered = history.filter(entry => 
      entry.userInput?.toLowerCase().includes(query.toLowerCase()) ||
      entry.aiResponse?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredHistory(filtered);
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-history-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const groupHistoryByDate = (history) => {
    const groups = {};
    history.forEach(entry => {
      const date = formatDate(entry.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    return groups;
  };

  const groupedHistory = groupHistoryByDate(filteredHistory);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-gray-600" />
          <h3 className="subtitle">Conversation History</h3>
        </div>
        
        <button
          onClick={exportHistory}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={history.length === 0}
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search conversation..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* History Stats */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Interactions:</span>
            <p className="font-medium">{history.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Language:</span>
            <p className="font-medium">{getLanguageName(language)}</p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.keys(groupedHistory).length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'No conversations found' : 'No conversation history yet'}
            </p>
          </div>
        ) : (
          Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-medium text-gray-700">{date}</h4>
              </div>
              
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    {/* User Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-blue-700">You</span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{entry.userInput}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-green-700">AI Assistant</span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{entry.aiResponse}</p>
                          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                            <span>Language: {getLanguageName(entry.language || language)}</span>
                            <span>•</span>
                            <span>Voice: {entry.voice || 'male'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            Found {filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
} 