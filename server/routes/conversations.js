const express = require('express');

module.exports = (sessionManager) => {
  const router = express.Router();

  // Helper methods
  const calculatePeakActivityHour = (history) => {
    if (history.length === 0) return null;
    
    const hourCounts = new Array(24).fill(0);
    
    history.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    return {
      hour: peakHour,
      count: hourCounts[peakHour]
    };
  };

  const calculateResponseTimeDistribution = (history) => {
    if (history.length < 2) return [];
    
    const responseTimes = [];
    
    for (let i = 1; i < history.length; i++) {
      const timeDiff = history[i].timestamp - history[i-1].timestamp;
      if (timeDiff > 0 && timeDiff < 30000) { // Ignore gaps > 30 seconds
        responseTimes.push(timeDiff);
      }
    }
    
    return {
      average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      distribution: createTimeDistribution(responseTimes)
    };
  };

  const createTimeDistribution = (responseTimes) => {
    const ranges = [
      { min: 0, max: 1000, label: '0-1s' },
      { min: 1000, max: 3000, label: '1-3s' },
      { min: 3000, max: 5000, label: '3-5s' },
      { min: 5000, max: 10000, label: '5-10s' },
      { min: 10000, max: Infinity, label: '10s+' }
    ];
    
    const distribution = {};
    ranges.forEach(range => {
      distribution[range.label] = responseTimes.filter(time => 
        time >= range.min && time < range.max
      ).length;
    });
    
    return distribution;
  };

  const convertToText = (exportData) => {
    let text = `Conversation Export\n`;
    text += `Session ID: ${exportData.session.id}\n`;
    text += `Created: ${new Date(exportData.session.createdAt).toLocaleString()}\n`;
    text += `Language: ${exportData.session.language}\n`;
    text += `Voice: ${exportData.session.voice}\n`;
    text += `Total Interactions: ${exportData.totalInteractions}\n\n`;
    
    exportData.history.forEach((entry, index) => {
      text += `Interaction ${index + 1} (${new Date(entry.timestamp).toLocaleString()})\n`;
      text += `User: ${entry.userInput}\n`;
      text += `AI: ${entry.aiResponse}\n\n`;
    });
    
    return text;
  };

  const searchInHistory = (history, query, limit) => {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    history.forEach((entry, index) => {
      const userMatch = entry.userInput?.toLowerCase().includes(lowerQuery);
      const aiMatch = entry.aiResponse?.toLowerCase().includes(lowerQuery);
      
      if (userMatch || aiMatch) {
        results.push({
          index,
          timestamp: entry.timestamp,
          userInput: entry.userInput,
          aiResponse: entry.aiResponse,
          matches: {
            user: userMatch,
            ai: aiMatch
          }
        });
      }
    });
    
    return results.slice(0, limit);
  };

  const extractTopics = (history) => {
    // Simple topic extraction based on common words
    const words = history.flatMap(entry => [
      ...(entry.userInput?.split(' ') || []),
      ...(entry.aiResponse?.split(' ') || [])
    ]);
    
    const wordCount = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  };

  const analyzeSentiment = (history) => {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    history.forEach(entry => {
      const text = `${entry.userInput} ${entry.aiResponse}`.toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 'neutral';
    
    const ratio = positiveCount / total;
    if (ratio > 0.6) return 'positive';
    if (ratio < 0.4) return 'negative';
    return 'neutral';
  };

  const extractKeyPhrases = (history) => {
    // Extract key phrases (simplified)
    const phrases = [];
    history.forEach(entry => {
      const text = `${entry.userInput} ${entry.aiResponse}`;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      phrases.push(...sentences.slice(0, 2)); // Take first 2 sentences from each interaction
    });
    
    return phrases.slice(0, 10);
  };

  const calculateLanguageDistribution = (history) => {
    const distribution = {};
    history.forEach(entry => {
      const lang = entry.language || 'en';
      distribution[lang] = (distribution[lang] || 0) + 1;
    });
    return distribution;
  };

  const calculateVoiceDistribution = (history) => {
    const distribution = {};
    history.forEach(entry => {
      const voice = entry.voice || 'male';
      distribution[voice] = (distribution[voice] || 0) + 1;
    });
    return distribution;
  };

  // Get conversation history for a session
  router.get('/:sessionId/history', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const history = await sessionManager.getSessionHistory(sessionId, parseInt(limit));
      const paginatedHistory = history.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      res.json({
        success: true,
        history: paginatedHistory,
        pagination: {
          total: history.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < history.length
        }
      });
    } catch (error) {
      console.error('Error getting conversation history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation history'
      });
    }
  });

  // Add conversation entry
  router.post('/:sessionId/entry', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { userInput, aiResponse, language, voice, audioUrl, duration } = req.body;
      
      const entry = await sessionManager.addToHistory(sessionId, {
        userInput,
        aiResponse,
        language,
        voice,
        audioUrl,
        duration,
        timestamp: Date.now()
      });
      
      res.status(201).json({
        success: true,
        entry
      });
    } catch (error) {
      console.error('Error adding conversation entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add conversation entry'
      });
    }
  });

  // Get conversation analytics
  router.get('/:sessionId/analytics', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const stats = await sessionManager.getSessionStats(sessionId);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Calculate additional analytics
      const history = await sessionManager.getSessionHistory(sessionId);
      
      const analytics = {
        ...stats,
        totalWords: history.reduce((sum, entry) => {
          return sum + (entry.userInput?.split(' ').length || 0) + (entry.aiResponse?.split(' ').length || 0);
        }, 0),
        averageUserMessageLength: history.length > 0 ? 
          history.reduce((sum, entry) => sum + (entry.userInput?.length || 0), 0) / history.length : 0,
        averageAIResponseLength: history.length > 0 ? 
          history.reduce((sum, entry) => sum + (entry.aiResponse?.length || 0), 0) / history.length : 0,
        conversationDuration: history.length > 0 ? 
          history[history.length - 1].timestamp - history[0].timestamp : 0,
        peakActivityHour: calculatePeakActivityHour(history),
        responseTimeDistribution: calculateResponseTimeDistribution(history)
      };

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Error getting conversation analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation analytics'
      });
    }
  });

  // Export conversation
  router.get('/:sessionId/export', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { format = 'json' } = req.query;
      
      const session = await sessionManager.getSession(sessionId);
      const history = await sessionManager.getSessionHistory(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      const exportData = {
        session: {
          id: session.id,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          language: session.language,
          voice: session.voice,
          settings: session.settings
        },
        history: history,
        exportDate: new Date().toISOString(),
        totalInteractions: history.length
      };

      if (format === 'txt') {
        const textContent = convertToText(exportData);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.txt"`);
        res.send(textContent);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.json"`);
        res.json(exportData);
      }
    } catch (error) {
      console.error('Error exporting conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export conversation'
      });
    }
  });

  // Search conversation
  router.get('/:sessionId/search', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { query, limit = 20 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const history = await sessionManager.getSessionHistory(sessionId);
      const searchResults = searchInHistory(history, query, parseInt(limit));
      
      res.json({
        success: true,
        results: searchResults,
        query,
        totalResults: searchResults.length
      });
    } catch (error) {
      console.error('Error searching conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search conversation'
      });
    }
  });

  // Get conversation summary
  router.get('/:sessionId/summary', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await sessionManager.getSession(sessionId);
      const history = await sessionManager.getSessionHistory(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      const summary = {
        sessionId: session.id,
        totalInteractions: history.length,
        duration: history.length > 0 ? 
          history[history.length - 1].timestamp - history[0].timestamp : 0,
        topics: extractTopics(history),
        sentiment: analyzeSentiment(history),
        keyPhrases: extractKeyPhrases(history),
        languageDistribution: calculateLanguageDistribution(history),
        voiceDistribution: calculateVoiceDistribution(history)
      };

      res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('Error getting conversation summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation summary'
      });
    }
  });

  return router;
}; 