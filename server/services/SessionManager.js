const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor(cacheService) {
    this.cacheService = cacheService;
    this.activeSessions = new Map();
    this.recordingSessions = new Map();
  }

  async createSession(options = {}) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      participants: [],
      language: options.language || process.env.DEFAULT_LANGUAGE || 'en',
      voice: options.voice || process.env.DEFAULT_VOICE || 'male',
      history: [],
      isRecording: false,
      recordingData: [],
      settings: {
        autoTranslate: options.autoTranslate || false,
        voiceEnabled: options.voiceEnabled || true,
        subtitleEnabled: options.subtitleEnabled || true
      }
    };

    await this.cacheService.setSession(sessionId, session);
    this.activeSessions.set(sessionId, session);
    
    return session;
  }

  async joinSession(sessionId, participantId, options = {}) {
    let session = await this.cacheService.getSession(sessionId);
    
    if (!session) {
      session = await this.createSession(options);
    }

    // Update session with new participant
    if (!session.participants.includes(participantId)) {
      session.participants.push(participantId);
    }

    // Update options if provided
    if (options.language) session.language = options.language;
    if (options.voice) session.voice = options.voice;

    session.lastActivity = Date.now();
    session.history = await this.cacheService.getSessionHistory(sessionId);

    await this.cacheService.setSession(sessionId, session);
    this.activeSessions.set(sessionId, session);

    return session;
  }

  async leaveSession(sessionId, participantId) {
    const session = await this.cacheService.getSession(sessionId);
    
    if (session) {
      session.participants = session.participants.filter(id => id !== participantId);
      session.lastActivity = Date.now();

      if (session.participants.length === 0) {
        // No more participants, cleanup session
        await this.cacheService.deleteSession(sessionId);
        this.activeSessions.delete(sessionId);
        this.recordingSessions.delete(sessionId);
      } else {
        await this.cacheService.setSession(sessionId, session);
        this.activeSessions.set(sessionId, session);
      }
    }
  }

  async getSession(sessionId) {
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      session = await this.cacheService.getSession(sessionId);
      if (session) {
        this.activeSessions.set(sessionId, session);
      }
    }

    return session;
  }

  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = Date.now();
      
      await this.cacheService.setSession(sessionId, session);
      this.activeSessions.set(sessionId, session);
      
      return session;
    }
    
    throw new Error('Session not found');
  }

  async addToHistory(sessionId, entry) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      const historyEntry = {
        id: uuidv4(),
        timestamp: entry.timestamp || Date.now(),
        userInput: entry.userInput,
        aiResponse: entry.aiResponse,
        language: entry.language || session.language,
        voice: entry.voice || session.voice,
        audioUrl: entry.audioUrl,
        duration: entry.duration
      };

      await this.cacheService.addToSessionHistory(sessionId, historyEntry);
      
      // Update session history in memory
      session.history = await this.cacheService.getSessionHistory(sessionId);
      session.lastActivity = Date.now();
      
      await this.cacheService.setSession(sessionId, session);
      this.activeSessions.set(sessionId, session);
      
      return historyEntry;
    }
    
    throw new Error('Session not found');
  }

  async getSessionHistory(sessionId, limit = 50) {
    const history = await this.cacheService.getSessionHistory(sessionId);
    return history.slice(-limit);
  }

  async startRecording(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      session.isRecording = true;
      session.recordingStartTime = Date.now();
      session.recordingData = [];
      
      await this.cacheService.setSession(sessionId, session);
      this.activeSessions.set(sessionId, session);
      this.recordingSessions.set(sessionId, {
        startTime: session.recordingStartTime,
        data: []
      });
      
      return session;
    }
    
    throw new Error('Session not found');
  }

  async stopRecording(sessionId) {
    const session = await this.getSession(sessionId);
    const recording = this.recordingSessions.get(sessionId);
    
    if (session && recording) {
      session.isRecording = false;
      session.recordingEndTime = Date.now();
      session.recordingDuration = session.recordingEndTime - session.recordingStartTime;
      
      const recordingData = {
        id: uuidv4(),
        sessionId,
        startTime: recording.startTime,
        endTime: session.recordingEndTime,
        duration: session.recordingDuration,
        data: recording.data,
        history: session.history.slice(-20) // Last 20 interactions
      };
      
      // Store recording in cache
      await this.cacheService.set(`recording:${recordingData.id}`, recordingData, 86400); // 24 hours
      
      session.recordings = session.recordings || [];
      session.recordings.push(recordingData.id);
      
      await this.cacheService.setSession(sessionId, session);
      this.activeSessions.set(sessionId, session);
      this.recordingSessions.delete(sessionId);
      
      return recordingData;
    }
    
    throw new Error('Session or recording not found');
  }

  async addRecordingData(sessionId, data) {
    const recording = this.recordingSessions.get(sessionId);
    
    if (recording) {
      recording.data.push({
        timestamp: Date.now(),
        data: data
      });
    }
  }

  async getRecording(recordingId) {
    return await this.cacheService.get(`recording:${recordingId}`);
  }

  async deleteSession(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      // Clean up recordings
      if (session.recordings) {
        for (const recordingId of session.recordings) {
          await this.cacheService.del(`recording:${recordingId}`);
        }
      }
      
      // Clean up session data
      await this.cacheService.deleteSession(sessionId);
      await this.cacheService.del(`history:${sessionId}`);
      
      this.activeSessions.delete(sessionId);
      this.recordingSessions.delete(sessionId);
      
      return true;
    }
    
    return false;
  }

  async getAllSessions() {
    const sessions = [];
    
    for (const [sessionId, session] of this.activeSessions) {
      sessions.push({
        id: sessionId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        participantCount: session.participants.length,
        language: session.language,
        voice: session.voice,
        isRecording: session.isRecording
      });
    }
    
    return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    
    for (const [sessionId, session] of this.activeSessions) {
      if (now - session.lastActivity > inactiveThreshold) {
        await this.leaveSession(sessionId, 'system');
      }
    }
  }

  async getSessionStats(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      const history = await this.getSessionHistory(sessionId);
      
      return {
        sessionId,
        totalInteractions: history.length,
        totalDuration: session.recordingDuration || 0,
        averageResponseTime: this.calculateAverageResponseTime(history),
        languageUsage: this.calculateLanguageUsage(history),
        voiceUsage: this.calculateVoiceUsage(history),
        lastActivity: session.lastActivity
      };
    }
    
    return null;
  }

  calculateAverageResponseTime(history) {
    if (history.length < 2) return 0;
    
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < history.length; i++) {
      const timeDiff = history[i].timestamp - history[i-1].timestamp;
      if (timeDiff > 0 && timeDiff < 30000) { // Ignore gaps > 30 seconds
        totalTime += timeDiff;
        count++;
      }
    }
    
    return count > 0 ? totalTime / count : 0;
  }

  calculateLanguageUsage(history) {
    const usage = {};
    
    history.forEach(entry => {
      const lang = entry.language || 'en';
      usage[lang] = (usage[lang] || 0) + 1;
    });
    
    return usage;
  }

  calculateVoiceUsage(history) {
    const usage = {};
    
    history.forEach(entry => {
      const voice = entry.voice || 'male';
      usage[voice] = (usage[voice] || 0) + 1;
    });
    
    return usage;
  }

  // Get active sessions count
  getActiveSessionsCount() {
    return this.activeSessions.size;
  }

  // Get recording sessions count
  getRecordingSessionsCount() {
    return this.recordingSessions.size;
  }
}

module.exports = SessionManager; 