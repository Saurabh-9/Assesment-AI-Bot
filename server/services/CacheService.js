const redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connect();
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
        password: process.env.REDIS_PASSWORD || undefined,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('The server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.connected = true;
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.connected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.connected = false;
    }
  }

  async get(key) {
    try {
      if (!this.connected) return null;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (!this.connected) return false;
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.connected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.connected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async expire(key, ttl) {
    try {
      if (!this.connected) return false;
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  async hget(hash, field) {
    try {
      if (!this.isConnected) return null;
      const value = await this.client.hGet(hash, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis hget error:', error);
      return null;
    }
  }

  async hset(hash, field, value) {
    try {
      if (!this.isConnected) return false;
      await this.client.hSet(hash, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis hset error:', error);
      return false;
    }
  }

  async hgetall(hash) {
    try {
      if (!this.connected) return {};
      const result = await this.client.hGetAll(hash);
      const parsed = {};
      for (const [key, value] of Object.entries(result)) {
        try {
          parsed[key] = JSON.parse(value);
        } catch {
          parsed[key] = value;
        }
      }
      return parsed;
    } catch (error) {
      console.error('Redis hgetall error:', error);
      return {};
    }
  }

  async lpush(key, value) {
    try {
      if (!this.connected) return false;
      await this.client.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis lpush error:', error);
      return false;
    }
  }

  async lrange(key, start, stop) {
    try {
      if (!this.connected) return [];
      const result = await this.client.lRange(key, start, stop);
      return result.map(item => JSON.parse(item));
    } catch (error) {
      console.error('Redis lrange error:', error);
      return [];
    }
  }

  async ltrim(key, start, stop) {
    try {
      if (!this.connected) return false;
      await this.client.lTrim(key, start, stop);
      return true;
    } catch (error) {
      console.error('Redis ltrim error:', error);
      return false;
    }
  }

  // Session-specific methods
  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async setSession(sessionId, sessionData, ttl = 3600) {
    return await this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async deleteSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  async getSessionHistory(sessionId) {
    return await this.lrange(`history:${sessionId}`, 0, -1);
  }

  async addToSessionHistory(sessionId, entry) {
    const success = await this.lpush(`history:${sessionId}`, entry);
    if (success) {
      // Keep only last 100 entries
      await this.ltrim(`history:${sessionId}`, 0, 99);
    }
    return success;
  }

  // Translation cache
  async getTranslation(text, targetLanguage) {
    return await this.get(`translation:${text}:${targetLanguage}`);
  }

  async setTranslation(text, targetLanguage, translation, ttl = 86400) {
    return await this.set(`translation:${text}:${targetLanguage}`, translation, ttl);
  }

  // Voice cache
  async getVoiceResponse(text, voice) {
    return await this.get(`voice:${text}:${voice}`);
  }

  async setVoiceResponse(text, voice, audioData, ttl = 3600) {
    return await this.set(`voice:${text}:${voice}`, audioData, ttl);
  }

  // Cleanup old sessions
  async cleanupOldSessions() {
    try {
      if (!this.connected) return;
      
      const keys = await this.client.keys('session:*');
      const now = Date.now();
      
      for (const key of keys) {
        const session = await this.get(key);
        if (session && (now - session.lastActivity) > 24 * 60 * 60 * 1000) {
          await this.del(key);
          const sessionId = key.replace('session:', '');
          await this.del(`history:${sessionId}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Health check
  isConnected() {
    return this.connected;
  }

  async ping() {
    try {
      if (!this.connected) return false;
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = CacheService; 