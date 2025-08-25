const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const SessionManager = require('./services/SessionManager');
const GeminiService = require('./services/GeminiService');
const CacheService = require('./services/CacheService');
const AudioProcessor = require('./services/AudioProcessor');
const GeminiLiveService = require('./services/GeminiLiveService');
const sessionRoutes = require('./routes/sessions');
const conversationRoutes = require('./routes/conversations');
const ttsRoutes = require('./routes/tts');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL   // e.g., https://yourdomain.com
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize services
const cacheService = new CacheService();
const sessionManager = new SessionManager(cacheService);
const geminiService = new GeminiService();
const audioProcessor = new AudioProcessor();
const geminiLive = new GeminiLiveService(geminiService);

// Routes
app.use('/api/sessions', sessionRoutes(sessionManager));
app.use('/api/conversations', conversationRoutes(sessionManager));
app.use('/api/tts', ttsRoutes());
// Broadcast live responses to the session room so all participants receive them
geminiLive.on('response', (payload) => {
  io.to(payload.sessionId).emit('ai-response', {
    text: payload.text,
    audio: payload.audio,
    language: payload.language,
    voice: payload.voice,
    timestamp: Date.now()
  });
});


// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      redis: cacheService.isConnected(),
      gemini: await geminiService.healthCheck()
    }
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  let currentSession = null;
  let audioStream = null;

  // Join session
  socket.on('join-session', async (data) => {
    try {
      const { sessionId, language = 'en', voice = 'male' } = data;
      currentSession = await sessionManager.joinSession(sessionId, socket.id, { language, voice });
      // open live session with system instruction restricting domain
      const systemInstruction = 'You are Rev, the voice assistant for Revolt Motors. Only discuss Revolt Motors products, services, and related topics.';
      await geminiLive.openSession(sessionId, systemInstruction);
      
      socket.join(sessionId);
      socket.emit('session-joined', { 
        sessionId, 
        language, 
        voice,
        history: currentSession.history || []
      });
      
      console.log(`Client ${socket.id} joined session ${sessionId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle audio stream
  socket.on('audio-stream', async (data) => {
    try {
      if (!currentSession) {
        socket.emit('error', { message: 'No active session' });
        return;
      }

      const { audioData, timestamp } = data;
      
      // Forward chunk to Gemini Live proxy (low-latency streaming path)
      await geminiLive.sendAudioChunk(currentSession, audioData);
    } catch (error) {
      console.error('Error processing audio:', error);
      socket.emit('error', { message: 'Error processing audio' });
    }
  });
  // Barge-in: user started speaking while AI is talking
  socket.on('interrupt', () => {
    if (currentSession) {
      geminiLive.interrupt(currentSession.id);
      socket.emit('interrupted');
    }
  });

  // Change language
  socket.on('change-language', async (data) => {
    try {
      const { language } = data;
      if (currentSession) {
        currentSession.language = language;
        await sessionManager.updateSession(currentSession.id, { language });
        socket.emit('language-changed', { language });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Change voice
  socket.on('change-voice', async (data) => {
    try {
      const { voice } = data;
      if (currentSession) {
        currentSession.voice = voice;
        await sessionManager.updateSession(currentSession.id, { voice });
        socket.emit('voice-changed', { voice });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Start recording
  socket.on('start-recording', async () => {
    try {
      if (currentSession) {
        await sessionManager.startRecording(currentSession.id);
        socket.emit('recording-started');
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Stop recording
  socket.on('stop-recording', async () => {
    try {
      if (currentSession) {
        const recording = await sessionManager.stopRecording(currentSession.id);
        socket.emit('recording-stopped', { recording });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (currentSession) {
      await geminiLive.closeSession(currentSession.id);
      await sessionManager.leaveSession(currentSession.id, socket.id);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;  

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io }; 