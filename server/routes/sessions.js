const express = require('express');

module.exports = (sessionManager) => {
  const router = express.Router();

  // Create a new session
  router.post('/', async (req, res) => {
    try {
      const { language, voice, autoTranslate, voiceEnabled, subtitleEnabled } = req.body;
      
      const session = await sessionManager.createSession({
        language,
        voice,
        autoTranslate,
        voiceEnabled,
        subtitleEnabled
      });

      res.status(201).json({
        success: true,
        session: {
          id: session.id,
          language: session.language,
          voice: session.voice,
          createdAt: session.createdAt,
          settings: session.settings
        }
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create session'
      });
    }
  });

  // Get session by ID
  router.get('/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await sessionManager.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        session: {
          id: session.id,
          language: session.language,
          voice: session.voice,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          participantCount: session.participants.length,
          isRecording: session.isRecording,
          settings: session.settings
        }
      });
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session'
      });
    }
  });

  // Update session
  router.put('/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const updates = req.body;
      
      const session = await sessionManager.updateSession(sessionId, updates);
      
      res.json({
        success: true,
        session: {
          id: session.id,
          language: session.language,
          voice: session.voice,
          lastActivity: session.lastActivity,
          settings: session.settings
        }
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update session'
      });
    }
  });

  // Get session history
  router.get('/:sessionId/history', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit = 50 } = req.query;
      
      const history = await sessionManager.getSessionHistory(sessionId, parseInt(limit));
      
      res.json({
        success: true,
        history,
        count: history.length
      });
    } catch (error) {
      console.error('Error getting session history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session history'
      });
    }
  });

  // Get session statistics
  router.get('/:sessionId/stats', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const stats = await sessionManager.getSessionStats(sessionId);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting session stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session statistics'
      });
    }
  });

  // Start recording
  router.post('/:sessionId/recording/start', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await sessionManager.startRecording(sessionId);
      
      res.json({
        success: true,
        message: 'Recording started',
        session: {
          id: session.id,
          isRecording: session.isRecording,
          recordingStartTime: session.recordingStartTime
        }
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start recording'
      });
    }
  });

  // Stop recording
  router.post('/:sessionId/recording/stop', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const recording = await sessionManager.stopRecording(sessionId);
      
      res.json({
        success: true,
        message: 'Recording stopped',
        recording: {
          id: recording.id,
          duration: recording.duration,
          startTime: recording.startTime,
          endTime: recording.endTime
        }
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop recording'
      });
    }
  });

  // Get recording
  router.get('/recording/:recordingId', async (req, res) => {
    try {
      const { recordingId } = req.params;
      
      const recording = await sessionManager.getRecording(recordingId);
      
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Recording not found'
        });
      }

      res.json({
        success: true,
        recording: {
          id: recording.id,
          sessionId: recording.sessionId,
          duration: recording.duration,
          startTime: recording.startTime,
          endTime: recording.endTime,
          history: recording.history
        }
      });
    } catch (error) {
      console.error('Error getting recording:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recording'
      });
    }
  });

  // Delete session
  router.delete('/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const deleted = await sessionManager.deleteSession(sessionId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete session'
      });
    }
  });

  // Get all active sessions
  router.get('/', async (req, res) => {
    try {
      const sessions = await sessionManager.getAllSessions();
      
      res.json({
        success: true,
        sessions,
        count: sessions.length,
        activeCount: sessionManager.getActiveSessionsCount(),
        recordingCount: sessionManager.getRecordingSessionsCount()
      });
    } catch (error) {
      console.error('Error getting sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sessions'
      });
    }
  });

  // Cleanup inactive sessions
  router.post('/cleanup', async (req, res) => {
    try {
      await sessionManager.cleanupInactiveSessions();
      
      res.json({
        success: true,
        message: 'Cleanup completed'
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup sessions'
      });
    }
  });

  return router;
}; 