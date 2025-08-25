const EventEmitter = require('events');

// Placeholder Gemini Live proxy. This simulates a live session API so we can
// swap in the real Gemini Live WebSocket without changing the rest of the app.
// For now it calls the existing GeminiService.getResponse() with a mock
// transcription to keep the pipeline working end-to-end.

class GeminiLiveService extends EventEmitter {
  constructor(geminiService) {
    super();
    this.geminiService = geminiService;
    this.sessions = new Map();
    this.model = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-preview-native-audio-dialog';
  }

  async openSession(sessionId, systemInstruction) {
    this.sessions.set(sessionId, {
      id: sessionId,
      systemInstruction: systemInstruction || '',
      responding: false,
    });
    this.emit('session-opened', { sessionId });
  }

  async closeSession(sessionId) {
    this.sessions.delete(sessionId);
    this.emit('session-closed', { sessionId });
  }

  // Barge-in: mark current response as interrupted; UI should stop playback
  interrupt(sessionId) {
    const s = this.sessions.get(sessionId);
    if (s) {
      s.responding = false;
      this.emit('interrupted', { sessionId });
    }
  }

  // In real implementation, forward PCM/Opus to Gemini Live socket.
  // Here we simulate by calling text-based Gemini and emitting a result.
  async sendAudioChunk(session, base64Chunk) {
    const s = this.sessions.get(session.id);
    if (!s) return;

    // Debounced/simplified: pretend we got a transcript and produce a reply
    if (s.responding) return; // avoid spamming
    s.responding = true;
    try {
      const mockTranscript = '...';
      const response = await this.geminiService.getResponse(mockTranscript, session);
      if (!this.sessions.has(session.id)) return; // session closed
      this.emit('response', {
        sessionId: session.id,
        text: response.text,
        audio: response.audio,
        language: session.language,
        voice: session.voice,
      });
    } finally {
      const curr = this.sessions.get(session.id);
      if (curr) curr.responding = false;
    }
  }
}

module.exports = GeminiLiveService;


