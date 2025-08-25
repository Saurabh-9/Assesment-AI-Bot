'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import ConversationInterface from '../components/ConversationInterface';
import SessionManager from '../components/SessionManager';
import Header from '../components/Header';
import { useSession } from '../hooks/useSession';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const { session, createSession, joinSession } = useSession();

  useEffect(() => {
    // Initialize socket connection
    const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    const newSocket = io(SOCKET_BASE, {
      // allow fallback to polling if ws handshake fails
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      timeout: 7000,
    });
    

    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from server');
    });

    newSocket.on('error', (error) => {
      toast.error(`Connection error: ${error.message}`);
    });

    newSocket.on('connect_error', (err) => {
      // surface detailed error for debugging
      console.warn('Socket connect_error:', err?.message || err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateSession = async (options) => {
    try {
      const newSession = await createSession(options);
      if (newSession && socket) {
        socket.emit('join-session', {
          sessionId: newSession.id,
          language: options.language,
          voice: options.voice,
        });
        setCurrentSession(newSession);
        toast.success('Session created successfully');
      }
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  const handleJoinSession = async (sessionId, options) => {
    try {
      const joinedSession = await joinSession(sessionId, options);
      if (joinedSession && socket) {
        socket.emit('join-session', {
          sessionId: joinedSession.id,
          language: options.language,
          voice: options.voice,
        });
        setCurrentSession(joinedSession);
        toast.success('Joined session successfully');
      }
    } catch (error) {
      toast.error('Failed to join session');
    }
  };

  const handleLeaveSession = () => {
    if (socket && currentSession) {
      socket.emit('leave-session', { sessionId: currentSession.id });
    }
    setCurrentSession(null);
    toast.success('Left session');
  };

  return (
    <div className="min-h-screen">
      <Header isConnected={isConnected} />
      
      <main className="container mx-auto px-4 py-8">
        {!currentSession ? (
          <SessionManager
            onCreateSession={handleCreateSession}
            onJoinSession={handleJoinSession}
            isConnected={isConnected}
          />
        ) : (
          <ConversationInterface
            socket={socket}
            session={currentSession}
            onLeaveSession={handleLeaveSession}
            isConnected={isConnected}
          />
        )}
      </main>
    </div>
  );
} 