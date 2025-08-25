'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSession = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/sessions`, {
        language: options.language || 'en',
        voice: options.voice || 'male',
        autoTranslate: options.autoTranslate || false,
        voiceEnabled: options.voiceEnabled !== false,
        subtitleEnabled: options.subtitleEnabled !== false,
      });

      if (response.data.success) {
        const newSession = response.data.session;
        setSession(newSession);
        return newSession;
      } else {
        throw new Error(response.data.error || 'Failed to create session');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const joinSession = useCallback(async (sessionId, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}`);
      
      if (response.data.success) {
        const joinedSession = {
          ...response.data.session,
          language: options.language || response.data.session.language,
          voice: options.voice || response.data.session.voice,
        };
        
        setSession(joinedSession);
        return joinedSession;
      } else {
        throw new Error(response.data.error || 'Failed to join session');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to join session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (sessionId, updates) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/sessions/${sessionId}`, updates);
      
      if (response.data.success) {
        const updatedSession = response.data.session;
        setSession(prev => prev?.id === sessionId ? updatedSession : prev);
        return updatedSession;
      } else {
        throw new Error(response.data.error || 'Failed to update session');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/sessions/${sessionId}`);
      
      if (response.data.success) {
        if (session?.id === sessionId) {
          setSession(null);
        }
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to delete session');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session]);

  const getSessionHistory = useCallback(async (sessionId, limit = 50) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/history?limit=${limit}`);
      
      if (response.data.success) {
        return response.data.history;
      } else {
        throw new Error(response.data.error || 'Failed to get session history');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get session history';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getSessionStats = useCallback(async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/stats`);
      
      if (response.data.success) {
        return response.data.stats;
      } else {
        throw new Error(response.data.error || 'Failed to get session stats');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get session stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const startRecording = useCallback(async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/sessions/${sessionId}/recording/start`);
      
      if (response.data.success) {
        return response.data.session;
      } else {
        throw new Error(response.data.error || 'Failed to start recording');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to start recording';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stopRecording = useCallback(async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/sessions/${sessionId}/recording/stop`);
      
      if (response.data.success) {
        return response.data.recording;
      } else {
        throw new Error(response.data.error || 'Failed to stop recording');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to stop recording';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getAllSessions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sessions`);
      
      if (response.data.success) {
        return response.data.sessions;
      } else {
        throw new Error(response.data.error || 'Failed to get sessions');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get sessions';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    session,
    loading,
    error,
    createSession,
    joinSession,
    updateSession,
    deleteSession,
    getSessionHistory,
    getSessionStats,
    startRecording,
    stopRecording,
    getAllSessions,
    clearSession,
    clearError,
  };
} 